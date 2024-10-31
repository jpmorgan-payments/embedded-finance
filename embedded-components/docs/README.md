### Disclaimer

⚠️ Warning: Use at Your Own Risk ⚠️

The code and instructions provided in this repository are intended for reference purposes only. The maintainers of this
repository do not assume any responsibility for any issues, damages, or losses that may arise from the use of this code
or instructions.<br/>
By using this repository, you acknowledge that:

- The code may not be stable or functional.
- There are no guarantees regarding the performance, reliability, or suitability of the code for any particular purpose.
- You are solely responsible for any consequences resulting from the use of this code.<br/>

Please proceed with caution and ensure you understand the implications of using this code in your projects.

# Overview

Use this documentation to learn how to generate a simple API client for consuming APIs offered on
the J.P.
Morgan [Payments Developer Portal](https://developer.payments.jpmorgan.com/api/embedded-banking-solutions/embedded-payments/overview).
You can also walk through the steps to enable mutual TLS authentication and digital signing logic on the same API
client.

To generate the simple API client, you can use  [OpenAPI Generator](https://openapi-generator.tech/). There are multiple
ways to use the OpenAPI Generator, but in
this guide you only need to look at its plugin
capability

At the end of this you will know how to:

1. Generate an API client using our API specifications
   and [OpenAPI Generator plugin](https://openapi-generator.tech/docs/plugins)
2. Integrate the generated code with mTLS for authentication and digital signing logic to sign payloads

## Pre-requisites

### Open API Specification

Download the API spec files
from
our [developer portal](https://developer.payments.jpmorgan.com/api/embedded-banking-solutions/embedded-payments/overview),
for the product you wish to use.

Please note, there could be multiple specs you may have to download, if for example you need to interact with both
Embedded Payments as well as
Digital Onboarding API's

### Project technical requirements

- The application needs to be of java language - jdk17 or above.
- The application uses maven for dependency management.
- The application uses spring framework – spring3
- You have the Mutual TLS transport and digital signing certificate with you and ready to use

## Step-By-Step Guide

This guide is broken into **five** steps to be completed in order. Once you have finished, you should be able to
generate a simple API client to use with J.P. Morgan's payment APIs.

1. [Create a project](README.md#Create-a-project)
2. [Configure OpenAPI Generator](README.md#Configure-OpenAPI-Generator)
3. [Generate code using the OpenAPI Generator plugin](README.md#Generate-code-using-the-OpenAPI-Generator-plugin)
4. [Enable mTLS authentication and digital signing](README.md#Enable-mTLS-authentication-and-digital-signing)
5. [How to use the SDK](README.md#How-to-use-the-SDK)

### Create a project:

1. Create a java project with jdk17 or above and maven for dependency management
2. Create a folder in the root directory of your project, to store all the spec file(s) downloaded earlier
   from [Payments
   Developer Portal](https://developer.payments.jpmorgan.com/api/embedded-banking-solutions/embedded-payments/overview)

### Configure OpenAPI Generator

In the pom file of your application, add the OpenAPI Generator plugin.

1. Take a look at the plugin details and choose your preferred configuration
   from [here](https://github.com/OpenAPITools/openapi-generator/tree/master/modules/openapi-generator-maven-plugin)
2. Since you may have multiple spec files, a reference on how to configure the plugin can be found
   at - [pom file](pom.xml)
3. The models/api's generated with the reference configuration at [pom.xml](pom.xml), use commonly used annotations
   from jackson,jakarta and spring. Please make sure you have the following dependencies added to your pom file

<details>

<summary>Dependencies</summary>

```xml

<dependencies>
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-web</artifactId>
    <version>6.1.12</version>
  </dependency>
  <dependency>
    <groupId>org.springframework</groupId>
    <artifactId>spring-context</artifactId>
    <version>6.1.12</version>
  </dependency>
  <dependency>
    <groupId>org.openapitools</groupId>
    <artifactId>jackson-databind-nullable</artifactId>
    <version>0.2.6</version>
  </dependency>
  <dependency>
    <groupId>jakarta.annotation</groupId>
    <artifactId>jakarta.annotation-api</artifactId>
    <version>3.0.0</version>
  </dependency>
  <dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <version>1.18.34</version>
  </dependency>
</dependencies>
   ```

</details>

### Generate code using the OpenAPI Generator plugin

Execute the following command to generate code.

```shell
mvn clean compile
```

The output of which will be generated into the output directory you configured on the plugin, and will contain

- Java models for request/response schemas
- API classes for all api's in the specification - to perform GET/POST requests
- API Client which has the core logic to make api requests and receive responses

Please note, the code generated by the OpenAPI Generator acts as a base for you to build your business logic on
top of.

### Enable mTLS authentication and digital signing

To enable mutual TLS authentication and payload signing capability on top of the generated API
client, add the following code under the sources in your project

- MtlsConfiguration - [see here](src/main/java/net/jpmchase/architecture/config/MTLSConfiguration.java)
- RestTemplateConfigurer -  [see here](src/main/java/net/jpmchase/architecture/config/RestTemplateConfigurer.java)
- The code above will need the following dependencies added to your pom file

<details>
<summary>Dependencies</summary>

```xml

<dependencies>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
  </dependency>
  <dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
  </dependency>
  <dependency>
    <groupId>org.apache.httpcomponents.client5</groupId>
    <artifactId>httpclient5</artifactId>
    <version>5.3.1</version>
  </dependency>
</dependencies>
```

</details>

And now with this code added, you are ready to start integrating with the (developer portal
API's)[https://developer.payments.jpmorgan.com/api/embedded-banking-solutions/embedded-payments/overview].

### How to use the SDK

You could either use the above project to implement your business interaction with JPMorgan payments API's or package
the above generated code above as an artifact to use in your business project.

#### Getting Started against the mock - without mTLS Auth

<details>
<summary>Sample code</summary>

```java

// Import classes:

import com.app.jpmorgan.payments.ApiClient;
import com.app.jpmorgan.payments.ApiException;
import com.app.jpmorgan.payments.Configuration;
import com.app.jpmorgan.payments.auth.*;
import com.app.jpmorgan.payments.models.epv1.*;
import com.app.jpmorgan.payments.api.AccountsApi;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

public class Example {
    public static void main(String[] args) {

        // Since we are not using mTLS in this instance, we create an empty configuration
        MTLSConfiguration mtlsConfiguration = MTLSConfiguration.builder().build();

        // Use the above mTLS configuration to create a rest template
        RestTemplateConfigurer restTemplateConfigurer = new RestTemplateConfigurer();
        RestTemplate restTemplate = restTemplateConfigurer.restTemplate(mtlsConfiguration);

        // Create an APIClient (OpenAPI generated code) instance using the resttemplate that has mTLS configured above
        ApiClient apiClient = new ApiClient(restTemplate);

        // Set a base path for the api you are trying to reach to on the api client - which is the mock API in this instance
        apiClient.setBasePath("https://api-mock.payments.jpmorgan.com//tsapi/ef/v1");

        try {
            // In this sample we are initializing accounts api (OpenAPI Generated code) to query a list of accounts
            AccountsApi accountsApi = new AccountsApi(apiClient);
            ListAccountsResponse listAccountsResponse = accountsApi.getAccounts(null, null, null, null);
            System.out.println(listAccountsResponse);
            //..your business logic goes here
        } catch (HttpClientErrorException clientErrorException) {

            //Any 4xx response will result in a HttpClientErrorException, you can extract the error response like shown below
            ApiError apiError = clientErrorException.getResponseBodyAs(ApiError.class);
            System.out.println(apiError.getContext());

        } catch (HttpServerErrorException serverErrorException) {

            //Any 5xx response will result in a HttpServerErrorException, you can extract the error response like shown below
            ApiError apiError = serverErrorException.getResponseBodyAs(ApiError.class);
            System.out.println(apiError.getContext());

        }

    }
}

```

</details>


You can also find examples on how to use the code you generated to trigger an API request from the Junit
tests [here](src/test/java/net/jpmchase/architecture/mock)

Please note that the tests above are set to run against our mock environment - https://api-mock.payments.jpmorgan.com/
and do not require any type of authentication.

To execute the tests from commandline, use the below command:

```shell
mvn test
```

#### Getting Started against the real API - with mTLS auth

As you are ready to code against the real API, please find below an example on how to use the SDK with mTLS
authentication.

<details>
<summary>Sample code</summary>

```java

// Import classes:

import com.app.jpmorgan.payments.ApiClient;
import com.app.jpmorgan.payments.ApiException;
import com.app.jpmorgan.payments.Configuration;
import com.app.jpmorgan.payments.auth.*;
import com.app.jpmorgan.payments.models.epv1.*;
import com.app.jpmorgan.payments.api.AccountsApi;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;

public class Example {
    public static void main(String[] args) {

        // Create a MTLS configuration object with transport certificate and digital signing key to be able to use mTLS authentication in your API request
        MTLSConfiguration mtlsConfiguration = MTLSConfiguration.builder()
                .mtlsTransportCertLocation("certs/transportCert.p12")
                .mtlsDigitalSigningPrivateKeyLocation("certs/private.key")
                .mtlsTransportCertPassword("credential of transport certificate").build();

        // Use the above mTLS configuration to create a rest template
        RestTemplateConfigurer restTemplateConfigurer = new RestTemplateConfigurer();
        RestTemplate restTemplate = restTemplateConfigurer.restTemplate(mtlsConfiguration);

        // Create an APIClient (OpenAPI generated code) instance using the resttemplate that has mTLS configured above
        ApiClient apiClient = new ApiClient(restTemplate);

        // Set a base path for the api you are trying to reach to on the api client
        apiClient.setBasePath("https://apigatewaycat.jpmorgan.com/tsapi/ef/v1");

        try {
            // In this sample we are initializing accounts api (OpenAPI Generated code) to query a list of accounts
            AccountsApi accountsApi = new AccountsApi(apiClient);
            ListAccountsResponse listAccountsResponse = accountsApi.getAccounts(null, null, null, null);
            System.out.println(listAccountsResponse);
            //..your business logic goes here
        } catch (HttpClientErrorException clientErrorException) {

            //Any 4xx response will result in a HttpClientErrorException, you can extract the error response like shown below
            ApiError apiError = clientErrorException.getResponseBodyAs(ApiError.class);
            System.out.println(apiError.getContext());

        } catch (HttpServerErrorException serverErrorException) {

            //Any 5xx response will result in a HttpServerErrorException, you can extract the error response like shown below
            ApiError apiError = serverErrorException.getResponseBodyAs(ApiError.class);
            System.out.println(apiError.getContext());

        }

    }
}

```

</details>

### Info

The instructions provided above have been verified with the following versions of the API specifications, in conjunction
with mTLS authentication:

- Version 1.0.9 of the Embedded Payments API
- Version 2.0.9 of the Embedded Payments API
- Version 1.0.8 of the Digital Onboarding API