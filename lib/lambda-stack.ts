import * as path from 'path'

import { Stack, StackProps, RemovalPolicy } from 'aws-cdk-lib'
import { Construct } from 'constructs'
// import * as apigateway from 'aws-cdk-lib/aws-apigateway'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs'

interface LambdaApiStackProps extends StackProps {
  projectName: string
  stageName: string
  commitHash?: string
}

export class LambdaApiStack extends Stack {
  constructor(scope: Construct, id: string, props: LambdaApiStackProps) {
    super(scope, id, props)
    const { projectName, stageName, commitHash } = props

    // function
    const lambdaFunction = new lambdaNodejs.NodejsFunction(this, 'LambdaFunction', {
      functionName: `${stageName}-${projectName}-lambda`,
      description: commitHash ? `Commit Hash: ${commitHash}` : '',
      runtime: lambda.Runtime.NODEJS_14_X,
      entry: path.join(__dirname, '../src/lambda/index.ts'),
      handler: 'handler',
      currentVersionOptions: {
        removalPolicy: stageName === 'dev' ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN,
      },
    })

    // alias
    const lambdaAlias = lambdaFunction.currentVersion.addAlias('alias')

    // api gateway
    // const restApi = new apigateway.RestApi(this, 'RestApi', {
    //   restApiName: `${stageName}-${projectName}-api`,
    // })
    // restApi.root.addMethod('GET', new apigateway.LambdaIntegration(lambdaAlias))
  }
}
