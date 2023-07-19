provider "aws" {
  region = "ap-northeast-1"
}

resource "aws_iam_role" "sf_coaching_bot_role" {
  name = "sf_coaching_bot_role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Effect = "Allow"
      },
    ]
  })

  tags = {
    Unit = "OIC"
  }
}

resource "aws_lambda_function" "sf_coaching_bot" {
  function_name = "sf_coaching_bot"
  role          = aws_iam_role.sf_coaching_bot_role.arn
  handler       = "index.handler"

  filename = "lambda/index.zip"

  runtime = "nodejs18.x"

  tags = {
    Unit = "OIC"
  }
}

resource "aws_api_gateway_rest_api" "api" {
  name        = "sf_coaching_api"
  description = "API for sf coaching bot"

  tags = {
    Unit = "OIC"
  }
}

resource "aws_api_gateway_resource" "resource" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  parent_id   = aws_api_gateway_rest_api.api.root_resource_id
  path_part   = "my_resource"
}

resource "aws_api_gateway_method" "method" {
  rest_api_id   = aws_api_gateway_rest_api.api.id
  resource_id   = aws_api_gateway_resource.resource.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "integration" {
  rest_api_id = aws_api_gateway_rest_api.api.id
  resource_id = aws_api_gateway_resource.resource.id
  http_method = aws_api_gateway_method.method.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.sf_coaching_bot.invoke_arn
}

resource "aws_api_gateway_deployment" "deployment" {
  depends_on  = [aws_api_gateway_integration.integration]
  rest_api_id = aws_api_gateway_rest_api.api.id
  stage_name  = "v1"
}

resource "aws_lambda_permission" "permission" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sf_coaching_bot.arn
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.api.execution_arn}/*/${aws_api_gateway_method.method.http_method}${aws_api_gateway_resource.resource.path}"
}

output "invoke_url" {
  value       = aws_api_gateway_deployment.deployment.invoke_url
  description = "The URL to invoke the API Gateway"
}
