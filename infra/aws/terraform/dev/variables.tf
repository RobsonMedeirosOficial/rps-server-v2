variable "region" {}

variable "aws_account_id" {}

variable "deploy_user_arn" {}

variable "domain_name" {}

variable "application_domain_name" {}

variable "default_vpc_id" {}

variable "default_subnets_ids" {}

variable "route53_zone_id" {}

variable "log_group_name" {}

variable "ecr_repository_name" {}

variable "ecr_policy_name" {}

variable "ecs_cluster_name" {}

variable "ecs_service_name" {}

variable "ecs_task_role_arn" {}

variable "alb_name" {}

variable "alb_security_group_name" {}

variable "target_group_name" {}

variable "ecs_security_group_name" {}

variable "ecs_service_container_name" {}

variable "ecs_service_container_port" {}

variable "ecs_service_container_cpu" {}

variable "ecs_service_container_memory" {}

variable "ecs_service_role_for_ecs_arn" {}

variable "ecs_autoscaling_min_capacity" {}

variable "ecs_autoscaling_max_capacity" {}

variable "ecs_autoscaling_memory_target_value" {}

variable "ecs_autoscaling_cpu_target_value" {}