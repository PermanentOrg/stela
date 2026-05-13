resource "aws_sqs_queue" "file_copier_prod_deadletter_queue" {
  name = "file-copier-prod-deadletter-queue"
}

resource "aws_sqs_queue" "file_copier_prod_queue" {
  name = "file-copier-prod-queue"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.file_copier_prod_deadletter_queue.arn
    maxReceiveCount     = 3
  })
}

resource "aws_sqs_queue_policy" "file_copier_prod_queue_policy" {
  queue_url = aws_sqs_queue.file_copier_prod_queue.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Service = "sns.amazonaws.com"
        },
        Action   = "sqs:SendMessage",
        Resource = aws_sqs_queue.file_copier_prod_queue.arn,
        Condition = {
          ArnEquals = {
            "aws:SourceArn" = var.event_topic_arn
          }
        }
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "file_copier_prod_subscription" {
  topic_arn = var.event_topic_arn
  protocol  = "sqs"
  endpoint  = aws_sqs_queue.file_copier_prod_queue.arn
  filter_policy = jsonencode({
    Entity = ["file"],
    Action = ["copy"]
  })
}

data "aws_iam_policy_document" "assume_prod_file_copier_lambda_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "file_copier_prod_lambda_role" {
  name               = "file-copier-prod-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.assume_prod_file_copier_lambda_role.json
}

resource "aws_iam_role_policy" "file_copier_prod_lambda_policy" {
  name = "file-copier-lambda-policy"
  role = aws_iam_role.file_copier_prod_lambda_role.name
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
          "s3:GetObject",
          "s3:PutObject",
        ]
        Effect   = "Allow"
        Resource = ["*", aws_sqs_queue.file_copier_prod_queue.arn]
      },
    ]
  })
}

resource "aws_lambda_function" "file_copier_prod_lambda" {
  package_type  = "Image"
  image_uri     = var.file_copier_lambda_image
  function_name = "file-copier-prod-lambda"
  role          = aws_iam_role.file_copier_prod_lambda_role.arn
  timeout       = 30

  vpc_config {
    security_group_ids = [var.prod_security_group_id]
    subnet_ids         = var.private_subnet_ids
  }

  environment {
    variables = {
      ENV                    = var.env
      SENTRY_DSN             = var.sentry_dsn
      DATABASE_URL           = var.prod_database_url
      S3_BUCKET              = var.s3_bucket
      CLOUDFRONT_URL         = var.cloudfront_url
      CLOUDFRONT_KEY_PAIR_ID = var.cloudfront_key_pair_id
      CLOUDFRONT_PRIVATE_KEY = var.cloudfront_private_key
      NODE_OPTIONS           = "--import ./packages/file_copier/dist/instrument.js"
    }
  }
}

resource "aws_lambda_event_source_mapping" "file_copier_prod_event_source_mapping" {
  event_source_arn                   = aws_sqs_queue.file_copier_prod_queue.arn
  function_name                      = aws_lambda_function.file_copier_prod_lambda.arn
  batch_size                         = 10
  maximum_batching_window_in_seconds = 0
}
