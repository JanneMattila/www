---
layout: posts
title: Azure Web Application Firewall on Application Gateway for Containers
image: /assets/posts/2025/08/11/waf-on-application-gateway-for-containers/waf-policy.png
date: 2025-08-11 06:00:00 +0300
categories: azure
tags: azure aks appgw containers waf
---

[Public Preview for Web Application Firewall on Application Gateway for Containers](https://azure.microsoft.com/en-us/updates/?id=499308) has been a long waited feature.
I had to immediately take it for a spin and update my AKS workshop demo when the public preview started.

---

If you're a new to 
[Application Gateway for Containers](https://learn.microsoft.com/en-us/azure/application-gateway/for-containers/overview),
then I highly recommend for you to read 
[Application Gateway for Containers components](https://learn.microsoft.com/en-us/azure/application-gateway/for-containers/application-gateway-for-containers-components)
and
[Azure Web Application Firewall on Application Gateway for Containers](https://learn.microsoft.com/en-us/azure/application-gateway/for-containers/web-application-firewall)
first, before diving into the demo.

---

I decided to update my AKS Workshop materials to use Web Application Firewall.
It's the most comprehensive demo material that I've built for AKS, so it's quite natural
place for me to add this. You can find the full workshop material from GitHub:

{% include githubEmbed.html text="JanneMattila/aks-workshop" link="JanneMattila/aks-workshop" %}

Application Gateway for Containers related snippets are in `08-agc.sh` file:

{% include githubEmbed.html text="08-agc.sh" link="JanneMattila/aks-workshop/blob/main/08-agc.sh" %}

First part of the script is about setting up Application Gateway for Containers:

- Create managed identity
- Grant necessary roles for that identity
- Setup federated credentials
- Install Helm chart

The above is fairly straight forward process.

> _If you happen to have Azure Policy enabled_, you might get the following error:<br/>
> Error creating: admission webhook "validation.gatekeeper.sh"
> denied the request: \[azurepolicy-k8sazurev3noprivilegeescalatio-621db1c4d893abfa0dcb\]<br/>
> **Privilege escalation container is not allowed**: cleanup<br/>
> You need to either disable Azure Policy or modify the policy configurations to allow this installation to proceed.

Second part of the script is about configuring Application Gateway for Containers.

1) Create Application Gateway for Containers:

```yaml
apiVersion: alb.networking.azure.io/v1
kind: ApplicationLoadBalancer
metadata:
  name: alb-demo
  namespace: alb-ns
spec:
  associations:
    - $vnet_spoke2_agc_subnet_id
```

The above takes a few minutes while it creates this resource:

{% include imageEmbed.html link="/assets/posts/2025/08/11/waf-on-application-gateway-for-containers/alb.png" %}


2) Create Gateway API resource with `azure-alb-external` gateway class that
was created during the installation: 

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: app-gateway
  namespace: alb-ns
  annotations:
    alb.networking.azure.io/alb-namespace: alb-ns
    alb.networking.azure.io/alb-name: alb-demo
spec:
  gatewayClassName: azure-alb-external
  listeners:
    - name: http
      port: 80
      protocol: HTTP
      allowedRoutes:
        namespaces:
```

3) Create Service to expose my previously deployed `network-app`:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: network-app-svc
  namespace: network-app
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 8080
  selector:
    app: network-app
```

4) Create HTTP Route to link Gateway to the Service:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: network-app-route
  namespace: network-app
spec:
  parentRefs:
    - kind: Gateway
      name: app-gateway
      namespace: alb-ns
  rules:
    - matches:
        - path:
            value: /
      backendRefs:
        - name: network-app-svc
          port: 80
```

5) Create WAF Policy using Bicep template:

```bash
param location string = resourceGroup().location

resource firewallPolicy 'Microsoft.Network/ApplicationGatewayWebApplicationFirewallPolicies@2024-07-01' = {
  name: 'waf-policy'
  location: location
  properties: {
    customRules: [
      {
        name: 'FinlandRateLimit'
        priority: 10
        ruleType: 'RateLimitRule'
        action: 'Block'
        matchConditions: [
          {
            matchVariables: [
              {
                variableName: 'RemoteAddr'
              }
            ]
            operator: 'GeoMatch'
            negationConditon: false
            matchValues: ['FI']
          }
        ]
        rateLimitThreshold: 4000
        rateLimitDuration: 'OneMin'
        groupByUserSession: [
          {
            groupByVariables: [
              {
                variableName: 'ClientAddr'
              }
            ]
          }
        ]
      }
      // Custom rules are abbreviated
    ]
    policySettings: {
      requestBodyCheck: true
      maxRequestBodySizeInKb: 128
      fileUploadLimitInMb: 100
      state: 'Enabled'
      mode: 'Prevention'
    }
    managedRules: {
      managedRuleSets: [
        {
          ruleSetType: 'Microsoft_DefaultRuleSet'
          ruleSetVersion: '2.1'
        }
        {
          ruleSetType: 'Microsoft_BotManagerRuleSet'
          ruleSetVersion: '1.1'
        }
      ]
      exclusions: []
    }
  }
}

output wafPolicyId string = firewallPolicy.id
```

Deploy WAF Policy Bicep file:

```bash
aks_agc_waf_policy_id=$(az deployment group create \
 --resource-group $resource_group_name \
 --template-file others/agc/waf-policy.bicep \
 --query "properties.outputs.wafPolicyId.value" \
 --output tsv)
```

Here is the deployed WAF Policy:

{% include imageEmbed.html link="/assets/posts/2025/08/11/waf-on-application-gateway-for-containers/waf-policy.png" %}

Here are the configured Managed rules:

{% include imageEmbed.html link="/assets/posts/2025/08/11/waf-on-application-gateway-for-containers/waf-rule1.png" %}

Here are the deployed Custom rules:

{% include imageEmbed.html link="/assets/posts/2025/08/11/waf-on-application-gateway-for-containers/waf-rule2.png" %}

6) Associate WAF Policy with Gateway:

```yaml
apiVersion: alb.networking.azure.io/v1
kind: WebApplicationFirewallPolicy
metadata:
  name: waf-policy
  namespace: alb-ns
spec:
  targetRef:
    group: gateway.networking.k8s.io
    kind: Gateway
    name: app-gateway
    namespace: alb-ns
  webApplicationFirewall:
    id: $aks_agc_waf_policy_id
```

This association link can be seen in Application Gateway for Containers in `securityPolicies`:

{% include imageEmbed.html link="/assets/posts/2025/08/11/waf-on-application-gateway-for-containers/alb2.png" %}

The above association links to this resource that can be seen when you enable _Show hidden types_ in the resource group:

{% include imageEmbed.html link="/assets/posts/2025/08/11/waf-on-application-gateway-for-containers/alb3.png" %}

It contains a link to the actual WAF Policy:

{% include imageEmbed.html link="/assets/posts/2025/08/11/waf-on-application-gateway-for-containers/alb4.png" %}

7) **Finally**, after all the above configurations, we're ready to test our WAF Policy:

```bash
curl $aks_agc_gateway_address
# Hello there!

curl -X POST --data 'INFO HOSTNAME' "$aks_agc_gateway_address/api/commands"
# -> Start: INFO HOSTNAME
# HOSTNAME: network-app-deployment-6956bdf4fc-8qnx2
# <- End: INFO HOSTNAME 4.777ms

curl -X POST --data '--; DROP TABLE Logs' "$aks_agc_gateway_address/api/commands" --verbose
# 403 Access Forbidden

curl -X POST --data 'alert(document.cookie);' "$aks_agc_gateway_address/api/commands" --verbose
# 403 Access Forbidden
```

As you can see, the last two requests were blocked by the WAF policy since they contained potentially malicious payloads.
Similarly, if you would make many requests in a short period of time, you would be rate-limited according to the deployed Custom rules.

Luckily, I had Azure Policy based diagnostics already enabled:

{% include imageEmbed.html link="/assets/posts/2025/08/11/waf-on-application-gateway-for-containers/alb-diag1.png" %}
{% include imageEmbed.html imagesize="60%" link="/assets/posts/2025/08/11/waf-on-application-gateway-for-containers/alb-diag2.png" %}

Since I had diagnostic setting configured for logging, I can view the WAF logs from the centralized Log Analytics workspace:

{% include imageEmbed.html link="/assets/posts/2025/08/11/waf-on-application-gateway-for-containers/log1.png" %}

As mentioned, full example of the above can be found from GitHub so you can easily test this scenario yourself:

{% include githubEmbed.html text="JanneMattila/aks-workshop" link="JanneMattila/aks-workshop" %}

I hope you find this useful!
