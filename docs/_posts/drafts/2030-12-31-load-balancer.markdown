---
title: Load Balancer
image: /assets/posts/2024/11/18/logic-app-and-easyauth/authentication1.png
date: 2020-12-31 06:00:00 +0300
layout: posts
categories: azure
tags: azure networking load-balancer
---

https://learn.microsoft.com/en-us/azure/load-balancer/load-balancer-tcp-reset
A common practice is to use a TCP keep-alive. This practice keeps the connection active for a longer period. For more information, see these .NET examples. With keep-alive enabled, packets are sent during periods of inactivity on the connection. Keep-alive packets ensure the idle timeout value isn't reached and the connection is maintained for a long period.

https://carsonip.me/posts/azure-tcp-idle-timeout-tcp-keepalive-python/

https://github.com/wbuchwalter/azure-content/blob/master/includes/guidance-tcp-session-timeout-include.md

https://support.esri.com/en-us/knowledge-base/change-the-operating-system-s-keepalive-settings-146247-000006285

https://www.reddit.com/r/networking/comments/1f4ystv/if_i_enable_tcp_keepalive_on_a_server_but_not_on/?rdt=41623

```console
$ netsh int tcp show global
Querying active state...

TCP Global Parameters
----------------------------------------------
Receive-Side Scaling State          : enabled
Receive Window Auto-Tuning Level    : normal
Add-On Congestion Control Provider  : default
ECN Capability                      : enabled
RFC 1323 Timestamps                 : allowed
Initial RTO                         : 1000
Receive Segment Coalescing State    : enabled
Non Sack Rtt Resiliency             : disabled
Max SYN Retransmissions             : 4
Fast Open                           : disabled
Fast Open Fallback                  : enabled
HyStart                             : enabled
Proportional Rate Reduction         : enabled
Pacing Profile                      : off

$ netsh int tcp set global tcpkeepalive=enabled

```

Linux

https://tldp.org/HOWTO/TCP-Keepalive-HOWTO/usingkeepalive.html

```console
$ cat /proc/sys/net/ipv4/tcp_keepalive_time
7200

$ cat /proc/sys/net/ipv4/tcp_keepalive_intvl
75

$ sudo bash -c "echo 60 > /proc/sys/net/ipv4/tcp_keepalive_time"
$ sudo bash -c "echo 60 > /proc/sys/net/ipv4/tcp_keepalive_intvl"

$ cat /etc/sysctl.conf
  net.ipv4.tcp_keepalive_time = 60

$ nc -l 5000

$ sysctl net.ipv4.tcp_keepalive_time net.ipv4.tcp_keepalive_intvl
$ sysctl -w net.ipv4.tcp_keepalive_time=60
$ sudo nano /etc/sysctl.conf
```

Capture filter

```
tcp port 5000 and not src host 168.63.129.16 and not dst host 168.63.129.16
```

