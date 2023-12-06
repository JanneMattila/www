# Notes

## Upcoming posts

- IIS folder and many files
- SNAT
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
- Amazerrr
- Cluster with Azure AD Auth
