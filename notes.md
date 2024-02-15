# Notes

## Upcoming posts

- AppGw and dynamic KQL impact to rules
- AppGw and Easy Auth
- Maintenance task as Container App
  - Cost, private vs. Func app
  - https://github.com/Azure/CloudShell
  - https://mcr.microsoft.com/en-us/product/azure-powershell/about
- Export Azure Resource templates to git repo daily
- NSG and ongoing connections behavior
  - https://learn.microsoft.com/en-us/azure/virtual-network/network-security-groups-overview
  - https://learn.microsoft.com/en-us/azure/firewall/long-running-sessions
- Azure PowerShell & ResourceId vs. Rest API
  - Invoke-AzVMRunCommand `
    -ResourceId "/subscriptions/...urceGroups/vm2_group/providers/Microsoft.Compute/virtualMachines/vm2" `
    -CommandId 'RunPowerShellScript' `
    -ScriptPath 'vm-script.ps1' `
    -Debug
- Container apps and DNS
- AppGw export IPs and do reverse lookup to locations, report view
- AKS and YARP
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
- Internet scam sites, DNS
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
- IIS folder and many files
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
- Echo & Webhooks
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
- AKS Identity
- Endpoint availability monitoring to app insights
  - Monitor Spring Boot actuator health endpoint and report it to App Insights
- Azure Functions and SFTP
- Web Navigator
- Cluster with Azure AD Auth
