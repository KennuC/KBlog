---
title: "HTB Academy: Getting Started [DRAFT}"
date: 2026-06-28
draft: false
---
> Note: the IPs shown may vary throughout as I write this blog across multiple sessions
# Overview


# Walkthrough

## Enumeration

Starting off with nmap scan:
```shell
sudo nmap -sV -sC --reason -oA standardscan $RHOST 
```
Output of `standardscan.nmap`
![[Pasted image 20260628215443.png]]
The nmap scan revealed:
- `port 22 ssh` 
- `port 80 http`
	- Web server - `Apache/2.4.41`
	- `robots.txt` showing disallowed entries
	- `/admin` path

## Web Enumeration

Finding a web server on port 80 - running `gobuster` to enumerate web directories

```
gobuster dir -u http://$RHOST/ -w /usr/share/seclists/Discovery/Web-Content/common.txt
```
![[Pasted image 20260628220710.png]]
The `gobuster` scan revealed some interesting web directories that can be explored further
- `/admin` as noted from `nmap` scan earlier
- `/backups`
- `/data`
- `/plugins`
- `/robots.txt`
- `/themes`


# Issues & How I Solved Them

