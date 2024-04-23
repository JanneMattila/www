# Notes

## Upcoming posts

- AKS Identity
  - In, Out
  - Admin, User access
  - Workload
  - App login access
- https://mac-blog.org.ua/nginx-powershell/
  - https://github.com/Badgerati/Pode
 https://github.com/JanneMattila/azure-storage-demos/blob/main/perf%2Fnotes.md
- ACS and SMTP email sending
  - App registration rest api
  - https://learn.microsoft.com/en-us/azure/communication-services/quickstarts/email/send-email-smtp/smtp-authentication
- Maintenance task as Container App
  - Cost, private vs. Func app
  - https://github.com/Azure/CloudShell
  - https://mcr.microsoft.com/en-us/product/azure-powershell/about
- Azure DevOps and getting rid of the Personal Access Tokens
- Office 365 Group and Teams incoming webhook
- AppService and Private Endpoint and DNS
  - Web app network tester
  - One target resource as private and other as public e.g., key vault
- VNET Private Link Service
  - Storage account
  - Resource Graph query to find out the exposes services
  - AKS
  - https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview#private-endpoint-properties
  - https://learn.microsoft.com/en-us/azure/private-link/private-endpoint-overview#private-link-resource
  - Diagram:
    - Provider hands over the resource id and subtype
    - Consumer creates a private endpoint
      - Add lock to prevent accidental deletion
    - Provider approves
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
- Azure VNet and subnet as property vs. child resource
  - https://github.com/Azure/azure-quickstart-templates/issues/2786
- Demo failures
  - VMSS 1000 VMs
  - AKS debugging with bridge in auditorium and zooming too much
- https://xyproblem.info/
  - https://www.lean.org/lexicon-terms/5-whys/
  - http://www.catb.org/esr/faqs/smart-questions.html
  - https://en.wikipedia.org/wiki/Five_whys
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
