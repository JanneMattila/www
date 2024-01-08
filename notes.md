# Notes

## Upcoming posts

- Private endpoint DNS records x 2 -> delete causes problems!
  - "Be careful when deleting private endpoints"
  - Resources: Storage, Key vault
  - https://github.com/MicrosoftDocs/azure-docs/issues/58044
- AAD Group sync
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
