data "aws_lambda_function" "account_space_update_staging_lambda" {
  function_name = "account-space-update-staging-lambda"
}

resource "aws_sqs_queue" "account_space_update_staging_deadletter_queue" {
  name = "account-space-update-staging-deadletter-queue"
}

resource "aws_sqs_queue" "account_space_update_staging_queue" {
  name = "account-space-update-staging-queue"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.account_space_update_staging_deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "account_space_update_staging_queue_policy" {
  queue_url = aws_sqs_queue.account_space_update_staging_queue.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action   = "sqs:SendMessage",
        Resource = aws_sqs_queue.account_space_update_staging_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = var.staging_event_topic_arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "account_space_update_staging_subscription" {
  topic_arn = var.staging_event_topic_arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.account_space_update_staging_queue.arn
  filter_policy = jsonencode({
    Entity = ["record"],
    Action = ["create", "copy"]
  })
}

data "aws_iam_policy_document" "assume_staging_account_space_update_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "account_space_update_staging_lambda_role" {
  name               = "account-space-update-staging-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_staging_account_space_update_role.json
}

resource "aws_iam_role_policy" "account_space_update_staging_lambda_policy" {
  name = "account-space-update-lambda-policy"
  role = aws_iam_role.account_space_update_staging_lambda_role.name
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "ec2:CreateNetworkInterface",
          "ec2:DescribeNetworkInterfaces",
          "ec2:DeleteNetworkInterface",
          "ec2:DescribeSecurityGroups",
          "ec2:DescribeSubnets",
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
        ]
        Effect   = "Allow"
        Resource = ["*", aws_sqs_queue.account_space_update_staging_queue.arn]
      },
    ]
  })
}

resource "aws_lambda_function" "account_space_update_staging_lambda" {
  package_type  = "Image"
  image_uri     = local.desired_images["account-space-update-staging-lambda"]
  function_name = "account-space-update-staging-lambda"
  role          = aws_iam_role.account_space_update_staging_lambda_role.arn
  timeout       = 30

  vpc_config {
    security_group_ids = [var.staging_security_group_id]
    subnet_ids         = var.subnet_ids
  }

  environment {
    variables = {
      ENV          = var.staging_env
      SENTRY_DSN   = var.sentry_dsn
      DATABASE_URL = var.staging_database_url
    }
  }
}

resource "aws_lambda_event_source_mapping" "account_space_update_staging_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.account_space_update_staging_queue.arn
  function_name                      = aws_lambda_function.account_space_update_staging_lambda.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 0
}
