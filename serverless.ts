require("dotenv").config();

import type { AWS } from "@serverless/typescript";

import { run, interactiveMessages, command } from "@functions/index";
import { TABLES } from "src/constants";

const serverlessConfiguration: AWS = {
  service: "${env:SERVICE_NAME}",
  frameworkVersion: "3",
  useDotenv: true,
  custom: {
    tables: { ...TABLES },
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node18",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    runtime: "nodejs18.x",
    region: "ap-northeast-2",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      SERVICE_NAME: "${self:service}",
      SLACK_CHANNEL_ID: "${env:SLACK_CHANNEL_ID}",
      SLACK_BOT_TOKEN: "${env:SLACK_BOT_TOKEN}",
      JIRA_KANBAN_NAME: "${env:JIRA_KANBAN_NAME}",
      JIRA_KANBAN_URL: "${env:JIRA_KANBAN_URL}",
      DDB_TABLE_NAME_USERS: "${env:DDB_TABLE_NAME_USERS}",
    },
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: [
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
        ],
        Resource:
          "arn:aws:lambda:${self:provider.region}:${env:AWS_ACCOUNT_ID}:*",
      },
    ],
    iam: {
      role: {
        statements: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            Resource: "*",
          },
          {
            Effect: "Allow",
            Action: [
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
            ],
            Resource:
              "arn:aws:dynamodb:${self:provider.region}:${env:AWS_ACCOUNT_ID}:table/${env:DDB_TABLE_NAME_USERS}",
          },
          {
            Effect: "Allow",
            Action: [
              "dynamodb:Query",
              "dynamodb:Scan",
              "dynamodb:GetItem",
              "dynamodb:PutItem",
              "dynamodb:UpdateItem",
              "dynamodb:DeleteItem",
              "lambda:InvokeFunction",
            ],
            Resource:
              "arn:aws:lambda:${self:provider.region}:${env:AWS_ACCOUNT_ID}:function:*",
          },
        ],
      },
    },
  },
  // import the function via paths
  functions: { run, interactiveMessages, command },
  resources: {
    Resources: {
      UserTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],

          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          TableName: "${env:DDB_TABLE_NAME_USERS}",
        },
      },
    },
  },
  package: {
    individually: true,
    patterns: [],
  },
};

module.exports = serverlessConfiguration;
