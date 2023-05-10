variable "region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-2"
}

variable "aws_account_id" {
  description = "AWS Account ID number"
  type        = number
  default     = 763700802744
}

variable "deploy_user_arn" {
  description = "ARN for IAM user with permission on infrastructure actions"
  type        = string
  default     = "arn:aws:iam::763700802744:user/github-scoremilk-cicd"
}

variable "domain_name" {
  description = "Score Milk domain name"
  type        = string
  default     = "scoremilk.com"
}

variable "application_domain_name" {
  description = "Domain name for this application"
  type        = string
}

variable "default_vpc_id" {
  description = "Default vpc id"
  type        = string
  default     = "vpc-246dd04f"
}

variable "default_subnets_ids" {
  description = "Default subnets ids"
  type        = list(string)
  default     = ["subnet-0435906f", "subnet-1c522850", "subnet-17acbf6d"]
}

variable "route53_zone_id" {
  description = "Zone Id for Score Milk on Route53"
  type        = string
  default     = "Z06869051O7PUQSPHABK7"
}

variable "log_group_name" {
  description = "CloudWatch log group name"
  type        = string
}

variable "ecr_repository_name" {
  description = "ECR repository name"
  type        = string
}

variable "ecr_policy_name" {
  description = "ECR policy name"
  type        = string
}

variable "ecs_cluster_name" {
  description = "Cluster name on ECS"
  type        = string
}

variable "ecs_service_name" {
  description = "Service name on cluster ECS"
  type        = string
  default     = "rps-server-service"
}

variable "ecs_task_role_arn" {
  description = "ARN for ECS task role that gives permission to tasks"
  type        = string
  default     = "arn:aws:iam::763700802744:role/ecsTaskExecutionRole"
}

variable "alb_name" {
  description = "Name of application load balancer"
  type        = string
}

variable "alb_security_group_name" {
  description = "Name of security group for ELB"
  type        = string
}

variable "target_group_name" {
  description = "Name of target group to associate with the load balancer"
  type        = string
}

variable "ecs_security_group_name" {
  description = "Name of security group for ECS service"
  type        = string
}

variable "ecs_service_container_name" {
  description = "Container name on cluster ECS inside a service"
  type        = string
  default     = "rps-server"
}

variable "ecs_service_container_port" {
  description = "Container port on cluster ECS inside a service"
  type        = number
  default     = 3000
}

variable "ecs_service_container_cpu" {
  description = "Container CPU capacity"
  type        = number
}

variable "ecs_service_container_memory" {
  description = "Container RAM memory capacity"
  type        = number
}

variable "ecs_service_role_for_ecs_arn" {
  description = "ARN for role to enable Amazon ECS to manage your cluster"
  type        = string
  default     = "arn:aws:iam::763700802744:role/aws-service-role/ecs.amazonaws.com/AWSServiceRoleForECS"
}

variable "ecs_autoscaling_min_capacity" {
  description = "Min capacity for autoscaling"
  type        = number
  default     = 1
}

variable "ecs_autoscaling_max_capacity" {
  description = "Max capacity for autoscaling"
  type        = number
  default     = 3
}

variable "ecs_autoscaling_memory_target_value" {
  description = "Target memory percentage to start autoscaling"
  type        = number
  default     = 80
}

variable "ecs_autoscaling_cpu_target_value" {
  description = "Target cpu percentage to start autoscaling"
  type        = number
  default     = 60
}