---
title: OneDrive tool to help me get out of the mess
image: /assets/posts/2024/06/10/onedrive-tool/drives.jpg
date: 2024-06-10 06:00:00 +0300
layout: posts
categories: appdev
tags: appdev onedrive
---

I have been taking pictures and videos for a long time.
This means that I have had media files in various memory cards and hard drives over the years:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/10/onedrive-tool/drives.jpg" %}

When
[OneDrive](https://www.microsoft.com/en-us/microsoft-365/onedrive/online-cloud-storage)
came, I started to use that to store my media files.
I've tried to be careful and make backup of the files to external hard drives.
But, as you can imagine, over the years I have ended up in mess.

I suddenly noticed that **certain files are not in OneDrive**.
This is from times when phones and cameras were not automatically uploading the files to cloud.

I had to analyze the situation a bit:

- OneDrive: 785 GB of data
- 2 hard drives with backups of the data
- Number of files: _too many to manually do anything meaningful_

Therefore, I decided to write a small tool to help me out: OneDrive tool.

## OneDrive tool

### Export

I started to think how to solve the problem.
First, I needed to get the metadata of the files from OneDrive to a CSV file.
If I have the metadata in CSV file,
I can easily analyze it with PowerShell or in Excel.
And all of this _offline_ without calling to the OneDrive APIs.

Here is how I exported the data from OneDrive:

```powershell
OneDriveTool `
  --export `
  --onedrive-file onedrive-export.csv
```

Tool starts to scan the files:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/10/onedrive-tool/onedrivetool1.png" %}

After 18 minute minutes, the tool has exported the data to CSV file:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/10/onedrive-tool/onedrivetool2.png" %}

Size of the file was 18 MB:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/10/onedrive-tool/onedrivetool3.png" %}

Here's how the exported CSV looks like:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/10/onedrive-tool/excel1.png" %}

Few important columns from the CSV file:

- `Name`: Name of the file
- `Size`: Size of the file
- `SHA1Hash`: SHA1 hash of the file

I can now quickly analyze that I've indeed exported the data correctly:

```powershell
$oneDriveCSV = Import-Csv -Path onedrive-export.csv -Delimiter ";"
"$($oneDriveCSV.Count) files found."

$oneDriveCSV | `
    Select-Object -Property Size -ExpandProperty Size | `
    Measure-Object -Sum | `
    Select-Object -ExpandProperty Sum | `
    ForEach-Object { $_ / 1GB }
```

Output:

```
73099 files found.
785,524600764737
```

## Hard drive scan

Next, I wanted to scan the hard drives.
Here's the command I used:

```powershell
OneDriveTool `
  --scan D:\Backup `
  --scan-file backup-harddrive1.csv `
  --onedrive-file onedrive-export.csv
```

Two new parameters needed:

- `--scan`: Path to the folder to scan
- `--scan-file`: Path to the CSV file where to save the scan results

Idea of this is to scan the files from hard drive and compare them to the files in OneDrive.
By compare, I mean SHA1 hash comparison. In the export step, I exported the SHA1 hash of the files
from OneDrive.
For local files, I need to calculate the SHA1 hash so that I can compare it to the OneDrive hash.
If the hashes match, then the file is already in OneDrive.

Tool starts to scan the files:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/10/onedrive-tool/onedrivetool5.png" %}

In the above screenshot, you can see that some of the files are already in OneDrive but some are not.

The above was test run but the real hard drive scan took a long time to finish:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/10/onedrive-tool/onedrivetool7.png" %}

After the scan, I have now CSV file with the scan results:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/10/onedrive-tool/onedrivetool6.png" %}

As you can see, there is `InOneDrive` column which tells if the local file is already in OneDrive or not.

```powershell
$csv = Import-Csv -Path backup-harddrive1.csv -Delimiter ";"

$filesMissingFromOneDrive = $csv | `
  Where-Object -Property InOneDrive -Value "FALSE" -EQ

"$($filesMissingFromOneDrive.Count) files found which are not available in OneDrive"

$jpgFiles = $filesMissingFromOneDrive | `
  Where-Object -Property Name -Value "*.jpg" -Like | `
  Select-Object @{
    Name       = 'Output';
    Expression = { $_.Path + "/" + $_.Name }
} | Select-Object -ExpandProperty Output

Copy-Item $jpgFiles \temp\copies -Force
```

The first hard drive has less than 100 files which are not in OneDrive.
I decided to copy all the missing `.jpg` files to a temporary folder waiting for upload:

```powershell
$csv = Import-Csv -Path backup-harddrive1.csv -Delimiter ";"

$filesMissingFromOneDrive = $csv | `
  Where-Object -Property InOneDrive -Value "FALSE" -EQ

"$($filesMissingFromOneDrive.Count) files found which are not available in OneDrive"

$jpgFiles = $filesMissingFromOneDrive | `
  Where-Object -Property Name -Value "*.jpg" -Like | `
  Select-Object @{
    Name       = 'Output';
    Expression = { $_.Path + "/" + $_.Name }
} | Select-Object -ExpandProperty Output

Copy-Item $jpgFiles \temp\copies -Force
```

The second hard drive had actually more files which were not in OneDrive.
Also many of the file names were not unique.

I decided to generate unique names for the files and copy them to a temporary folder:

```powershell
$csv = Import-Csv -Path backup-harddrive2.csv -Delimiter ";"

$filesMissingFromOneDrive = $csv | `
  Where-Object -Property InOneDrive -Value "FALSE" -EQ

"$($filesMissingFromOneDrive.Count) files found which are not available in OneDrive"

$allFiles = $filesMissingFromOneDrive | `
  Where-Object -Property Name -Value "*.info" -NotLike | `
  Where-Object -Property Name -Value "*.db" -NotLike | `
  Where-Object -Property Name -Value "*.ini" -NotLike | `
  Select-Object @{
    Name       = 'Output';
    Expression = { $_.Path + "/" + $_.Name }
} | Select-Object -ExpandProperty Output

$index = 10000
foreach ($source in $allFiles) {
    $destinationExtension = Split-Path -Path $source -Resolve -Extension
    Copy-Item $source "\temp\copies\$index$destinationExtension" -Force
    $index++
}
```

After the above, I just uploaded the files to the OneDrive using the browser.
Here are updated stats after the upload:

```
78617 files found.
793,870651786216
```

It means that 5000 extra files were found during this process.

Here is the tool in GitHub:

{% include githubEmbed.html text="JanneMattila/onedrive-tool" link="JanneMattila/onedrive-tool" %}

## What's next?

One of the cameras I have used in the past is this Sony Camcorder:

{% include imageEmbed.html width="100%" height="100%" link="/assets/posts/2024/06/10/onedrive-tool/sony.jpg" %}

It has been a good camera for me _but_ there is one annoying thing with it.
It saves the videos in `.mts` format. Unfortunately, OneDrive does not support playing `.mts` files
directly in the app or in the browser. This means that I have to either download
each video to local machine and watch it there _or_
then I'll have to convert the files to `.mp4` format before uploading them to OneDrive.

Since I have my OneDrive data in CSV file, I can analyze it easily with PowerShell.

```powershell
$oneDriveCSV = Import-Csv -Path onedrive-export.csv -Delimiter ";"
$mtsFiles = $oneDriveCSV | `
  Where-Object -Property Name -Value "*.mts" -Like

"$($mtsFiles.Count) .mts files found."

$mtsFiles | `
    Select-Object -Property Size -ExpandProperty Size | `
    Measure-Object -Sum | `
    Select-Object -ExpandProperty Sum | `
    ForEach-Object { $_ / 1GB }
```

Output from the above is:

```
811 .mts files found.
164,926849365234
```

So, I have 811 `.mts` files in my OneDrive and they take 164,9 GB of space.
This is something I need to take care of next. Expect a blog post about that in the future.
