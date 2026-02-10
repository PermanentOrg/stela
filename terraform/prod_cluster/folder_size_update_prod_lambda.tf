resource "aws_sqs_queue" "folder_size_update_prod_deadletter_queue" {
  name = "folder-size-update-prod-deadletter-queue"
}

resource "aws_sqs_queue" "folder_size_update_prod_queue" {
  name = "folder-size-update-prod-queue"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.folder_size_update_prod_deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "folder_size_update_prod_queue_policy" {
  queue_url = aws_sqs_queue.folder_size_update_prod_queue.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action   = "sqs:SendMessage",
        Resource = aws_sqs_queue.folder_size_update_prod_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = var.event_topic_arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "folder_size_update_prod_subscription" {
  topic_arn = var.event_topic_arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.folder_size_update_prod_queue.arn
  filter_policy = jsonencode({
    Entity = ["record"],
    Action = ["create", "copy", "delete"]
  })
}

data "aws_iam_policy_document" "assume_prod_folder_size_update_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "folder_size_update_prod_lambda_role" {
  name               = "folder-size-update-prod-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_prod_folder_size_update_role.json
}

resource "aws_iam_role_policy" "folder_size_update_prod_lambda_policy" {
  name = "folder-size-update-lambda-policy"
  role = aws_iam_role.folder_size_update_prod_lambda_role.name
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
        Resource = ["*", aws_sqs_queue.folder_size_update_prod_queue.arn]
      },
    ]
  })
}

resource "aws_lambda_function" "folder_size_update_prod_lambda" {
  package_type  = "Image"
  image_uri     = var.folder_size_updater_lambda_image
  function_name = "folder-size-update-prod-lambda"
  role          = aws_iam_role.folder_size_update_prod_lambda_role.arn
  timeout       = 30

  vpc_config {
    security_group_ids = [var.prod_security_group_id]
    subnet_ids         = var.subnet_ids
  }

  environment {
    variables = {
      ENV          = var.env
      SENTRY_DSN   = var.sentry_dsn
      DATABASE_URL = var.prod_database_url
    }
  }
}

resource "aws_lambda_event_source_mapping" "folder_size_update_prod_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.folder_size_update_prod_queue.arn
  function_name                      = aws_lambda_function.folder_size_update_prod_lambda.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 0
}
