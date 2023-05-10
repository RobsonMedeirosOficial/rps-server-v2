resource "aws_acm_certificate" "this" {
  domain_name       = var.application_domain_name
  validation_method = "DNS"
}

resource "aws_acm_certificate_validation" "this" {
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [aws_route53_record.acm.fqdn]
}

resource "aws_lb" "this" {
  name               = var.alb_name
  internal           = false
  load_balancer_type = "application"
  subnets            = tolist(var.default_subnets_ids)

  security_groups = [
    aws_security_group.alb_sg.id
  ]
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = 443
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"

  ssl_policy      = "ELBSecurityPolicy-2016-08"
  certificate_arn = aws_acm_certificate.this.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.this.arn
  }
}

resource "aws_cloudwatch_log_group" "this" {
  name = "/ecs/${var.ecr_repository_name}"
}

resource "aws_ecr_repository" "this" {
  name                 = var.ecr_repository_name
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_lifecycle_policy" "this" {
  repository = aws_ecr_repository.this.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "keep last 10 images"
      action = {
        type = "expire"
      }
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
    }]
  })
}

data "aws_iam_policy_document" "this" {
  statement {
    sid    = var.ecr_policy_name
    effect = "Allow"

    principals {
      type        = "*"
      identifiers = [var.deploy_user_arn]
    }

    actions = [
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:BatchCheckLayerAvailability",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
      "ecr:DescribeRepositories",
      "ecr:GetRepositoryPolicy",
      "ecr:ListImages",
      "ecr:DeleteRepository",
      "ecr:BatchDeleteImage",
      "ecr:SetRepositoryPolicy",
      "ecr:DeleteRepositoryPolicy",
    ]
  }
}

resource "aws_ecr_repository_policy" "this" {
  repository = aws_ecr_repository.this.name
  policy     = data.aws_iam_policy_document.this.json
}

resource "aws_ecs_service" "this" {
  name                               = var.ecs_service_name
  cluster                            = var.ecs_cluster_name
  task_definition                    = aws_ecs_task_definition.this.arn
  desired_count                      = 1
  depends_on                         = [var.ecs_service_role_for_ecs_arn]
  launch_type                        = "FARGATE"
  scheduling_strategy                = "REPLICA"
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  health_check_grace_period_seconds  = 30

  network_configuration {
    security_groups  = [aws_security_group.ecs_sg.id]
    subnets          = tolist(var.default_subnets_ids)
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.this.arn
    container_name   = var.ecs_service_container_name
    container_port   = var.ecs_service_container_port
  }

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }
}

resource "aws_route53_record" "acm" {
  name = tolist(aws_acm_certificate.this.domain_validation_options)[0].resource_record_name
  type = tolist(aws_acm_certificate.this.domain_validation_options)[0].resource_record_type

  records = [tolist(aws_acm_certificate.this.domain_validation_options)[0].resource_record_value]

  zone_id = var.route53_zone_id

  ttl = 120
}

resource "aws_route53_record" "alb" {
  type    = "A"
  name    = var.application_domain_name
  zone_id = var.route53_zone_id

  alias {
    evaluate_target_health = true
    name                   = aws_lb.this.dns_name
    zone_id                = aws_lb.this.zone_id
  }
}

resource "aws_security_group" "alb_sg" {
  name_prefix = var.alb_security_group_name

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs_sg" {
  name_prefix = var.ecs_security_group_name

  ingress {
    from_port   = var.ecs_service_container_port
    to_port     = var.ecs_service_container_port
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_ecs_task_definition" "this" {
  family                   = var.ecr_repository_name
  task_role_arn            = var.ecs_task_role_arn
  execution_role_arn       = var.ecs_task_role_arn
  network_mode             = "awsvpc"
  cpu                      = var.ecs_service_container_cpu
  memory                   = var.ecs_service_container_memory
  requires_compatibilities = ["FARGATE"]

  depends_on = [aws_cloudwatch_log_group.this]

  container_definitions = <<TASK_DEFINITION
[
        {
            "name": "${var.ecs_service_container_name}",
            "image": "${var.aws_account_id}.dkr.ecr.${var.region}.amazonaws.com/${var.ecr_repository_name}",
            "cpu": 0,
            "portMappings": [
                {
                    "name": "${var.ecr_repository_name}-tcp",
                    "containerPort": ${var.ecs_service_container_port},
                    "hostPort": ${var.ecs_service_container_port},
                    "protocol": "tcp",
                    "appProtocol": "http"
                }
            ],
            "essential": true,
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-create-group": "true",
                    "awslogs-group": "/ecs/${var.log_group_name}",
                    "awslogs-region": "${var.region}",
                    "awslogs-stream-prefix": "ecs"
                }
            },
            "runtimePlatform": {
                "cpuArchitecture": "X86_64",
                "operatingSystemFamily": "LINUX"
            },
            "environment": [
                { "name": "AWS_REGION", "value": "${var.region}" }
            ],
            "ulimits": [
                {
                    "name": "nofile",
                    "softLimit": 1024000,
                    "hardLimit": 1024000
                }
            ]
        }
]
TASK_DEFINITION
}

resource "aws_lb_target_group" "this" {
  name        = var.target_group_name
  port        = var.ecs_service_container_port
  protocol    = "HTTP"
  vpc_id      = var.default_vpc_id
  target_type = "ip"

  health_check {
    healthy_threshold   = "3"
    interval            = "30"
    protocol            = "HTTP"
    matcher             = "200"
    timeout             = "5"
    path                = "/health"
    unhealthy_threshold = "2"
  }

  depends_on = [
    aws_lb.this
  ]
}

resource "aws_appautoscaling_target" "dev_to_target" {
  min_capacity       = var.ecs_autoscaling_min_capacity
  max_capacity       = var.ecs_autoscaling_max_capacity
  resource_id        = "service/${var.ecs_cluster_name}/${var.ecs_service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "dev_to_memory" {
  name               = "dev-to-memory"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dev_to_target.resource_id
  scalable_dimension = aws_appautoscaling_target.dev_to_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dev_to_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }

    target_value = var.ecs_autoscaling_memory_target_value
  }
}

resource "aws_appautoscaling_policy" "dev_to_cpu" {
  name               = "dev-to-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dev_to_target.resource_id
  scalable_dimension = aws_appautoscaling_target.dev_to_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.dev_to_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value = var.ecs_autoscaling_cpu_target_value
  }
}