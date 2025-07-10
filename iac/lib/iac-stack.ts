import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class IacStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaFn = new NodejsFunction(this, 'ImageLambda', {
      entry: '../src/index.ts',
      handler: 'handler',
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(300),
      bundling: {
        minify: true,
        sourceMap: false,
        nodeModules: ['p-limit', 'jimp', 'image-hash'],
        commandHooks: {
          beforeInstall: () => [],
          beforeBundling: () => [],
          afterBundling: (_inputDir, outputDir) => [
            `npx esbuild ${path.resolve(__dirname, '../../src/worker.ts')} \
           --bundle --platform=node --target=node18 \
           --outfile=${path.join(outputDir, 'worker.js')}`
          ],
        }
      },
      depsLockFilePath: '../src/package-lock.json',
    });

    lambdaFn.addToRolePolicy(new iam.PolicyStatement({
      actions: ['rekognition:DetectLabels'],
      resources: ['*'],
    }));

    const httpApi = new apigw.HttpApi(this, 'ImageApi');

    const lambdaIntegration = new integrations.HttpLambdaIntegration(
      'LambdaIntegration',
      lambdaFn
    );

    httpApi.addRoutes({
      path: '/aggregate',
      methods: [apigw.HttpMethod.POST],
      integration: lambdaIntegration,
    });

    new cdk.CfnOutput(this, 'APIEndpoint', {
      value: httpApi.apiEndpoint + '/aggregate',
    });
  }
}