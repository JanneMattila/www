# Notes

## Upcoming posts

- @Azure
  Application Gateway now supports:
  ✅ JWT Validation
  ✅ mTLS Passthrough
  ✅ TLS/TCP Proxy
  - https://x.com/AzNetEng/status/1996293359825232260?t=yBNwhqKrtoUJUFTt-cBcHg&s=09

- Why would I need to build multi-agent system?
https://techcommunity.microsoft.com/blog/azuredevcommunityblog/build-multi%E2%80%91agent-ai-systems-with-microsoft/4454510

https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/keeping-agents-on-track-introducing-task-adherence-in-azure-ai-foundry/4458397

https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/better-detecting-cross-prompt-injection-attacks-introducing-spotlighting-in-azur/4458404

- Architecture: Share models vs. project specific deployments

- SQL Injection vs. prompt injection, Evaluations vs. Unit testings
 - Show .NET code with SQL query + SQL Profiler, EF Core
  - Show how SQL injection works
 - Show similar in prompt injection
  - Show how you can try to mitigate it

 - Logic Apps as remote MCP server
 - https://techcommunity.microsoft.com/blog/integrationsonazureblog/introducing-logic-apps-mcp-servers-public-preview/4450419
 - https://learn.microsoft.com/en-us/azure/logic-apps/set-up-model-context-protocol-server-standard
 - https://techcommunity.microsoft.com/blog/integrationsonazureblog/logic-apps---mcp-demos/4452175
 
 - Evaluations

- IP based filtering in solutions and migrations
 - Pre-create Public IP Prefix
 - Let customer know well in advance
 - If possible, add capability to application to check if there is access to the new IP address
 - Deploy AKS with Public IP Prefix
 - https://learn.microsoft.com/en-us/azure/aks/configure-static-egress-gateway
 - Chart overtime to shift traffic to new IP address
 - 


- AKS & KEP-1442
 - https://kubernetes.io/blog/2025/04/23/kubernetes-v1-33-release/#secret-less-image-pulls-with-kubelet
 - Pull images with managed identity from different tenant

- AKS & Blobfuse2
 - https://youtu.be/FmMDHrdM5TE
 - https://learn.microsoft.com/en-us/azure/storage/blobs/blobfuse2-what-is
 - https://github.com/Azure/azure-storage-fuse
 - https://learn.microsoft.com/en-us/azure/aks/azure-csi-blob-storage-provision?tabs=mount-nfs%2Csecret
 - Single process to fetch up to date data
 - Multiple processes operating these data assets

- Create your own MCP server
  - You own a data asset that company wants to share to other users
  - Hosting MCP server at the sidecar of App Service.
  - https://mcp.azure.com/

- Windows voice dictations
 - Windows + H
 - Language change
 - https://support.microsoft.com/fi-fi/windows/windowsin-puheentunnistuksen-komennot-9d25ef36-994d-f367-a81a-a326160128c7
 - https://support.microsoft.com/en-us/windows/windows-speech-recognition-commands-9d25ef36-994d-f367-a81a-a326160128c7
 - https://support.microsoft.com/en-us/windows/open-the-dictation-toolbar-2013a632-3a3f-230e-475d-4ad035ec0102
 - Use this with when discussing Copilot. I want to "type fast" but I can read fast so I don't want computer to speak to me
 - 

- AppGw + WAF
  - Cookie "sql" with SQL injection
  - Developer tools, show encoded and unencoded data
  - Application Gateway WAF logs
  - Show management studio query example

 - MCP & AKS: https://github.com/Azure/aks-mcp

 - Deployment safe guards: https://learn.microsoft.com/en-us/azure/aks/deployment-safeguards

- Change Analysis
  - E.g., incorrect image in infra deployment

- https://azure.microsoft.com/en-us/updates?id=492953
  

- Deployment custom role:
  - deployment/write for ARM template
  - Other permissions still required
  - Azure Portal uses ARM templates
  - Download template at the end of the resource creation wizard

- 2 AZ app, front and backend, LBs in between, how to force traffic to stay in AZ
  - https://learn.microsoft.com/en-us/azure/reliability/availability-zones-overview?tabs=azure-cli#physical-and-logical-availability-zones

- Traffic manager and private app in two regions

- https://learn.microsoft.com/en-us/azure/application-gateway/configuration-http-settings#connection-draining

- Connection Monitor

- [Testing your Teams chatbot with DemoType](https://www.cloudappie.nl/testing-teams-chatbot-demotype/)

- Managed disks and:
  You might notice traffic towards "md-*.blob.storage.azure.net" endpoint. This endpoint is used for internal components of Azure Managed Disks. Blocking access to this endpoint from your firewall should not cause any issues.

- APIM, LA, App Service, Easy Auth
  if(empty(triggerBody()),'HEADER',triggerBody())

- azure-ad-on-behalf-of.http
- Alert rule and Teams chat notification (requires json conversion)

- PowerShell webserver to able to receive token from url
  
- LB Keepalive
netsh int tcp set global tcpkeepalive=enabled
netsh int tcp show global
Registry Settings: You can also configure keepalive settings through the registry:

Open the Registry Editor by typing regedit in the Run dialog (Win + R).
Navigate to HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters.
Create or modify the following DWORD values:
KeepAliveTime: Determines how often TCP sends keep-alive transmissions. The default value is 7200000 milliseconds (2 hours)2.
KeepAliveInterval: Determines the interval between keep-alive retransmissions until a response is received. The default value is 1000 milliseconds (1 second)2.
The default TCP keepalive timeout for Windows is 2 hours, and the keepalive interval is 1 second2.
https://learn.microsoft.com/en-us/windows/win32/winsock/so-keepalive
https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc782936(v=ws.10)
https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-server-2003/cc758083(v=ws.10)


- Azure DevOps
  - Managed Identity / Service Principal to run some automations e.g., backup of repositories
  - https://learn.microsoft.com/en-us/azure/devops/organizations/security/data-protection?view=azure-devops
  - https://learn.microsoft.com/en-us/rest/api/azure/devops/git/repositories/restore-repository-from-recycle-bin?view=azure-devops-rest-7.1
  - https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/service-principal-managed-identity?view=azure-devops

- AppGw and cert chain
- AppGw + mTLS
  - https://gordon.byers.me/azure/application-gateway-mtls-letsencrypt.html
  - https://github.com/MicrosoftDocs/azure-docs/blob/main/articles/application-gateway/mutual-authentication-certificate-management.md
  - https://learn.microsoft.com/en-us/azure/application-gateway/mutual-authentication-overview?tabs=powershell

- NVA,AFW to do NATting of VNET addresses

- https://learn.microsoft.com/en-us/azure/sap/workloads/rise-integration
  - https://azure.microsoft.com/en-us/updates/cross-aad-vnet-peering/
  - https://learn.microsoft.com/en-us/azure/virtual-network/create-peering-different-subscriptions?tabs=create-peering-portal#cli
  - https://learn.microsoft.com/en-us/azure/sap/workloads/rise-integration-network
  - https://techcommunity.microsoft.com/t5/azure-networking-blog/network-connectivity-for-rise-with-sap-s-4hana-cloud-private/ba-p/4266263

- AKS Backup, Disk snapshots,

- Backup SoMe videos
 - yt-dlp.exe -k "https://www.youtube.com/watch?v=..."
 - 

- Azure Container Storage
  - https://aka.ms/Azure-container-storage-ga-blog
  - https://aka.ms/AzureContainerStorageDocs

- AKS and affinity rules, pod anti-affinity, node affinity, etc.
- ACS and SMTP email sending
  - App registration rest api
  - https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/send-email-smtp/smtp-authentication

- What's in it for me
 - YouTube: Whitaker James - What's in it for me
   - https://www.youtube.com/watch?v=8Ia6FX-tqcE&pp=ygUYamFtZXMgd2hpdGFrZXIgbWljcm9zb2Z0
   - 
- NFS and Storage account - Secure access
  - https://learn.microsoft.com/en-us/azure/storage/files/files-nfs-protocol
  - https://learn.microsoft.com/en-us/azure/storage/files/files-nfs-protocol#features
- Entra ID - API Chain OBO - API Examples, jwt.ms
- 429s from app to load balancing solutions
 - AKS: livenessProbe, readinessProbe, etc.
 - https://learn.microsoft.com/en-us/azure/traffic-manager/traffic-manager-overview
   - Azure Traffic Manager is a DNS-based traffic load balancer
- Teams, subscription, event hub and notifications
  - https://github.com/JanneMattila/teams-demos
  - https://learn.microsoft.com/en-us/graph/change-notifications-delivery-event-hubs
    - "Microsoft Graph Change Tracking" -> "Azure Event Hubs Data Sender"
- Disk performance analysis
  - AKS SSD v2
  - https://github.com/JanneMattila/playground-aks-storage/blob/main/notes.md#example-disk-perf-analysis
- Sub move resource validation script
- GitHub Copilot and C++ Direct2D game
- AppService and Private Endpoint and DNS
  - Web app network tester
  - One target resource as private and other as public e.g., key vault
- App Service and unique hostname
  - https://techcommunity.microsoft.com/t5/apps-on-azure-blog/public-preview-creating-web-app-with-a-unique-default-hostname/ba-p/4156353
- Network Security Perimeters
  - https://learn.microsoft.com/en-us/rest/api/networkmanager/network-security-perimeters/create-or-update?view=rest-networkmanager-2023-07-01-preview&viewFallbackFrom=rest-networkmanager-2023-09-01&tabs=HTTP
- Private Endpoint policies
  - https://learn.microsoft.com/en-us/azure/private-link/disable-private-endpoint-network-policy?tabs=network-policy-portal
- AKS Backup and Restore
- https://vscode.dev/ & https://marketplace.visualstudio.com/items?itemName=jannemattila.send-snippet-to-terminal
  - https://code.visualstudio.com/api/extension-guides/web-extensions
- Logic Apps and scaling:
  - https://techcommunity.microsoft.com/t5/azure-integration-services-blog/packing-more-workflows-into-logic-app-standard/ba-p/4127827
  - https://techcommunity.microsoft.com/t5/azure-integration-services-blog/scaling-logic-app-standard-for-high-throughput-scenarios/ba-p/3866731
  - https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-limits-and-config?tabs=standard#workflow-definition-limits
- Custom image & Login with Entra ID
  - "This image does not support Login with Entra ID"
  - https://github.com/danielsollondon/azvmimagebuilder/issues/32
  - az vm extension set --publisher Microsoft.Azure.ActiveDirectory --name AADLoginForWindows --resource-group rg --vm-name vm
  - https://learn.microsoft.com/en-us/entra/identity/devices/howto-vm-sign-in-azure-ad-windows#enable-microsoft-entra-login-for-a-windows-vm-in-azure
- Managed identity and API permissions
  - Publish API permissions
- Update Basic Public IP Dynamic to Static, and further to Standard SKU
- Azure Machine Configuration
  - https://learn.microsoft.com/en-us/azure/governance/machine-configuration/how-to/develop-custom-package/2-create-package
  - DSC resource level visibility in the Azure portal
- GitOps & Flux & workload identity to access GitHub
  - https://fluxcd.io/flux/installation/configuration/workload-identity/
  - https://learn.microsoft.com/en-us/azure/azure-arc/kubernetes/tutorial-use-gitops-flux2?tabs=azure-cli#workload-identity-in-aks-clusters
  - Chicken and egg problem
- AKS Identity
  - In, Out
  - Admin, User access
  - Workload
  - App login access
- GitOps and hard coding e.g., Managed identity Arc-enabled Kubernetes
  - How to avoid hard coding
- https://mac-blog.org.ua/nginx-powershell/
  - https://github.com/Badgerati/Pode
- https://github.com/JanneMattila/azure-storage-demos/blob/main/perf%2Fnotes.md
- https://learn.microsoft.com/en-us/azure/azure-monitor/agents/azure-monitor-agent-migration
- Azure DevOps and getting rid of the Personal Access Tokens
  - https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/authentication-guidance?view=azure-devops
  - https://learn.microsoft.com/en-us/azure/devops/integrate/get-started/authentication/service-principal-managed-identity?view=azure-devops
- Office 365 Group and Teams incoming webhook
- VNET transitive peering
  - https://learn.microsoft.com/en-us/azure/virtual-network/virtual-networks-faq#if-i-peer-vneta-to-vnetb-and-i-peer-vnetb-to-vnetc-does-that-mean-vneta-and-vnetc-are-peered
- Export Azure Resource templates to git repo daily
- Azure PowerShell & ResourceId vs. Rest API
  - Invoke-AzVMRunCommand `
    -ResourceId "/subscriptions/...urceGroups/vm2_group/providers/Microsoft.Compute/virtualMachines/vm2" `
    -CommandId 'RunPowerShellScript' `
    -ScriptPath 'vm-script.ps1' `
    -Debug
- Container apps and DNS
- AppGw export IPs and do reverse lookup to locations, report view
- AKS and YARP
- Application Insights and telemetry initializer, otel
- PowerShell & FileSystemWatcher
  - https://jqlang.github.io/jq/
  - Azure IoT jq development helper pwsh script, save and run jq
  - https://devblogs.microsoft.com/powershell-community/a-reusable-file-system-event-watcher-for-powershell/
  - https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/register-objectevent?view=powershell-7.4
  - https://stackoverflow.com/questions/67824771/filewatcher-in-powershell-not-firing-events
  - https://learn.microsoft.com/en-us/answers/questions/973077/powershell-file-watcher
- Func app
  - Long running task
  - Split to multiple functions, durable functions, etc.
  - App Service Plan and WebJobs & Always On - https://learn.microsoft.com/en-us/azure/app-service/webjobs-create
    - Basic SKU
- Logic App Conversion
- RayLib
  - https://www.raylib.com/examples.html
  - https://github.com/ChrisDill/Raylib-cs
  - SDL 2.0
- Internet scam sites, DNS
  - How old is the domain
  - https://www.ipvoid.com/domain-reputation-check/
  - https://en.wikipedia.org/wiki/WHOIS
  - https://github.com/flipbit/whois
  - https://github.com/jsakamoto/WhoisClient.NET/
  - https://www.whois.com/whois/
  - http://flipbit.co.uk/2009/06/querying-whois-server-data-with-c.html
  - Domain information
- Terraform
- Network troubleshooting series
  - Latency
  - Bandwidth
  - Private DNS
    - No Custom DNS configured in VNET
    - No Private DNS Zone linked to VNET hosting Custom DNS
    - No A Record in Private DNS Zone
    - No NSG rule allowing DNS traffic
    - No DNS server configured in VNET
    - No DNS server configured in VM
    - No DNS server configured in AKS
- SNAT
- Amazerrr
- Arc enabled servers - Onboarding using policy
  - Lock down each feature
- PowerShell
  # https://www.scriptinglibrary.com/languages/powershell/powershell-text-to-speech/
  if ($null -eq $global:SpeechSynthesizer) {
      "Loaded existing speech synthesizer"
      Add-Type -AssemblyName System.Speech
      $global:SpeechSynthesizer = New-Object -TypeName System.Speech.Synthesis.SpeechSynthesizer

      $global:SpeechSynthesizer.SelectVoice("Microsoft Zira Desktop")
  } 

  $SpeechSynthesizer.Speak("Computer says no")
  $SpeechSynthesizer.Speak("Computer says yes")
- Demo failures
  - VMSS 1000 VMs
  - AKS debugging with bridge in auditorium and zooming too much
- https://xyproblem.info/
  - https://www.lean.org/lexicon-terms/5-whys/
  - http://www.catb.org/esr/faqs/smart-questions.html
  - https://en.wikipedia.org/wiki/Five_whys
  - Dead horse theory
- GitHub Copilot
- Azure Firewall & No network connectivity
- AKS Edge Essentials
 - This deployment has exceeded its 30 day trial period. For full update support and commercial use, please acquire license as per the methods described at https://aka.ms/aks-edge/licensing. The current End-User-License-Agreement only allows use for development or testing purposes. It does not allow commercial deployments and hence this cluster may not receive periodic updates and upgrades
- Sticky Notes
- API Examples
- AKS Workshop
- Network tester & Latency
  - SAP framework
- webapp-update
- webapp-and-folders
- Kubernetes probe demo
- Network test scripts
- TCP Network tests
- Azure Policy
- Azure Virtual WAN with secured virtual hub demo
- Endpoint availability monitoring to app insights
  - Monitor Spring Boot actuator health endpoint and report it to App Insights
- Azure Functions and SFTP
- Web Navigator
- Cluster with Azure AD Auth
- bundle update
```console
$ bundle update
etching gem metadata from https://rubygems.org/...........
Resolving dependencies.....
Fetching concurrent-ruby 1.2.3 (was 1.1.9)
Installing concurrent-ruby 1.2.3 (was 1.1.9)
Fetching i18n 1.14.1 (was 0.9.5)
Installing i18n 1.14.1 (was 0.9.5)
Fetching minitest 5.22.2 (was 5.15.0)
Installing minitest 5.22.2 (was 5.15.0)
Using thread_safe 0.3.6
Fetching tzinfo 1.2.11 (was 1.2.9)
Installing tzinfo 1.2.11 (was 1.2.9)
Fetching zeitwerk 2.6.13 (was 2.5.3)
Installing zeitwerk 2.6.13 (was 2.5.3)
Fetching activesupport 6.0.6.1 (was 6.0.4.4)
Installing activesupport 6.0.6.1 (was 6.0.4.4)
Fetching public_suffix 5.0.4 (was 4.0.6)
Installing public_suffix 5.0.4 (was 4.0.6)
Fetching addressable 2.8.6 (was 2.8.0)
Installing addressable 2.8.6 (was 2.8.0)
Fetching base64 0.2.0
Installing base64 0.2.0
Using bundler 2.2.16
Fetching coffee-script-source 1.12.2 (was 1.11.1)
Installing coffee-script-source 1.12.2 (was 1.11.1)
Fetching execjs 2.9.1 (was 2.8.1)
Installing execjs 2.9.1 (was 2.8.1)
Using coffee-script 2.4.1
Using colorator 1.1.0
Fetching commonmarker 0.23.10 (was 0.17.13)
Installing commonmarker 0.23.10 (was 0.17.13) with native extensions
Fetching unf_ext 0.0.9.1 (x64-mingw32) (was 0.0.8)
Installing unf_ext 0.0.9.1 (x64-mingw32) (was 0.0.8)
Using unf 0.1.4
Using simpleidn 0.2.1
Fetching dnsruby 1.70.0 (was 1.61.9)
Installing dnsruby 1.70.0 (was 1.61.9)
Using eventmachine 1.2.7 (x64-mingw32)
Using http_parser.rb 0.8.0
Using em-websocket 0.5.3
Fetching ffi 1.16.3 (x64-mingw32) (was 1.15.5)
Installing ffi 1.16.3 (x64-mingw32) (was 1.15.5)
Fetching ethon 0.16.0 (was 0.15.0)
Installing ethon 0.16.0 (was 0.15.0)
Fetching faraday-net_http 3.0.2 (was 1.0.1)
Installing faraday-net_http 3.0.2 (was 1.0.1)
Using ruby2_keywords 0.0.5
Fetching faraday 2.8.1 (was 1.9.3)
Installing faraday 2.8.1 (was 1.9.3)
Using forwardable-extended 2.6.0
Fetching gemoji 4.1.0 (was 3.0.1)
Installing gemoji 4.1.0 (was 3.0.1)
Fetching sawyer 0.9.2 (was 0.8.2)
Installing sawyer 0.9.2 (was 0.8.2)
Fetching octokit 4.25.1 (was 4.22.0)
Installing octokit 4.25.1 (was 4.22.0)
Fetching typhoeus 1.4.1 (was 1.4.0)
Installing typhoeus 1.4.1 (was 1.4.0)
Fetching github-pages-health-check 1.18.2 (was 1.17.9)
Installing github-pages-health-check 1.18.2 (was 1.17.9)
Fetching rb-fsevent 0.11.2 (was 0.11.0)
Installing rb-fsevent 0.11.2 (was 0.11.0)
Using rb-inotify 0.10.1
Using sass-listen 4.0.0
Using sass 3.7.4
Using jekyll-sass-converter 1.5.2
Fetching listen 3.9.0 (was 3.7.0)
Installing listen 3.9.0 (was 3.7.0)
Using jekyll-watch 2.2.1
Fetching rexml 3.2.6 (was 3.2.5)
Installing rexml 3.2.6 (was 3.2.5)
Fetching kramdown 2.4.0 (was 2.3.1)
Installing kramdown 2.4.0 (was 2.3.1)
Fetching liquid 4.0.4 (was 4.0.3)
Installing liquid 4.0.4 (was 4.0.3)
Using mercenary 0.3.6
Using pathutil 0.16.2
Fetching rouge 3.30.0 (was 3.26.0)
Installing rouge 3.30.0 (was 3.26.0)
Using safe_yaml 1.0.5
Fetching jekyll 3.9.5 (was 3.9.0)
Installing jekyll 3.9.5 (was 3.9.0)
Fetching jekyll-avatar 0.8.0 (was 0.7.0)
Installing jekyll-avatar 0.8.0 (was 0.7.0)
Fetching jekyll-coffeescript 1.2.2 (was 1.1.1)
Installing jekyll-coffeescript 1.2.2 (was 1.1.1)
Fetching jekyll-commonmark 1.4.0 (was 1.3.1)
Installing jekyll-commonmark 1.4.0 (was 1.3.1)
Fetching jekyll-commonmark-ghpages 0.4.0 (was 0.1.6)
Installing jekyll-commonmark-ghpages 0.4.0 (was 0.1.6)
Fetching jekyll-default-layout 0.1.5 (was 0.1.4)
Installing jekyll-default-layout 0.1.5 (was 0.1.4)
Fetching jekyll-feed 0.17.0 (was 0.15.1)
Installing jekyll-feed 0.17.0 (was 0.15.1)
Using jekyll-gist 1.5.0
Fetching jekyll-github-metadata 2.16.1 (was 2.13.0)
Installing jekyll-github-metadata 2.16.1 (was 2.13.0)
Using jekyll-include-cache 0.2.1
Fetching racc 1.7.3 (was 1.6.0)
Installing racc 1.7.3 (was 1.6.0) with native extensions
Fetching nokogiri 1.15.5 (x64-mingw32) (was 1.13.0)
Installing nokogiri 1.15.5 (x64-mingw32) (was 1.13.0)
Fetching html-pipeline 2.14.3 (was 2.14.0)
Installing html-pipeline 2.14.3 (was 2.14.0)
Using jekyll-mentions 1.6.0
Using jekyll-optional-front-matter 0.3.2
Using jekyll-paginate 1.1.0
Using jekyll-readme-index 0.3.0
Using jekyll-redirect-from 0.16.0
Using jekyll-relative-links 0.6.1
Using rubyzip 2.3.2
Using jekyll-remote-theme 0.4.3
Fetching jekyll-seo-tag 2.8.0 (was 2.7.1)
Installing jekyll-seo-tag 2.8.0 (was 2.7.1)
Using jekyll-sitemap 1.4.0
Using jekyll-swiss 1.0.0
Using jekyll-theme-architect 0.2.0
Using jekyll-theme-cayman 0.2.0
Using jekyll-theme-dinky 0.2.0
Using jekyll-theme-hacker 0.2.0
Using jekyll-theme-leap-day 0.2.0
Using jekyll-theme-merlot 0.2.0
Using jekyll-theme-midnight 0.2.0
Using jekyll-theme-minimal 0.2.0
Using jekyll-theme-modernist 0.2.0
Using jekyll-theme-primer 0.6.0
Using jekyll-theme-slate 0.2.0
Using jekyll-theme-tactile 0.2.0
Using jekyll-theme-time-machine 0.2.0
Using jekyll-titles-from-headings 0.5.3
Fetching jemoji 0.13.0 (was 0.12.0)
Installing jemoji 0.13.0 (was 0.12.0)
Using kramdown-parser-gfm 1.1.0
Using minima 2.5.1
Using unicode-display_width 1.8.0
Using terminal-table 1.8.0
Fetching github-pages 231 (was 223)
Installing github-pages 231 (was 223)
Fetching tzinfo-data 1.2024.1 (was 1.2021.5)
Installing tzinfo-data 1.2024.1 (was 1.2021.5)
Using wdm 0.1.1
Bundle updated!
Post-install message from dnsruby:
Installing dnsruby...
  For issues and source code: https://github.com/alexdalitz/dnsruby
  For general discussion (please tell us how you use dnsruby): https://groups.google.com/forum/#!forum/dnsruby
Post-install message from html-pipeline:
-------------------------------------------------
Thank you for installing html-pipeline!
You must bundle Filter gem dependencies.
See html-pipeline README.md for more details.
https://github.com/jch/html-pipeline#dependencies
-------------------------------------------------
```
