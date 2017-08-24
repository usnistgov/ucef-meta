#!/bin/bash


fedmgrIP="http://fedManager"
# fedmgrIP=$2
fedmgrIPport="8083"
fedmgr="/fedmgr"


url=${fedmgrIP}":"${fedmgrIPport}${fedmgr}

# start fedmgr
start_fedmgr(){
   mvn exec:java -U -X -P FederationManagerExecJava 2>&1 | tee -a /root/Projects/c2wt/logs/log.txt
}

# check if fedmgrRest is up

waitforfedmgrRESTup(){
    query="curl -sL -w "%{http_code}\\n" "${url}" -o /dev/null"
    #  echo $query
    result=`$query`
    echo $result
    while [ $result -ne 200 ] ; do
        echo "Sleep"
        sleep 1
        result=`$query`
    done
    echo "fedmgr started"
    
}
# issue start
initializefedmgr(){
  echo "==========================\n"
  echo "Sending START POST REQUEST"
  curl -i -X POST ${url} --data '{"action": "START"}' -H "Content-Type: application/json"
  sleep 2
  echo "FedManager Initialized!!\n"
  echo "=========================\n"
}



echo $url

if [ $1 = "FedManager" ]; then
   echo "Starting --> " $1
   #xvfb-run -a mvn exec:exec -P Fedmanager
   #xvfb-run -a mvn exec:exec -P FedManager &> /root/Projects/c2wt/logs/log.txt
   #xvfb-run -a mvn package exec:exec -P FedManager 2>&1 | tee -a /root/Projects/c2wt/logs/log.txt
   #mvn exec:java -U -X -P FederationManagerExecJava 2>&1 | tee -a /root/Projects/c2wt/logs/log.txt
   start_fedmgr
else
  echo "Starting -->" $1
  #mvn exec:exec -P $1 &> /root/Projects/c2wt/logs/log.txt
  #mvn package exec:exec -P $1  2>&1 | tee -a /root/Projects/c2wt/logs/log.txt
  waitforfedmgrRESTup
  initializefedmgr
  if echo $1 | grep "ExecJava"
  then
      mvn exec:java -P $1  2>&1 | tee -a /root/Projects/c2wt/logs/log.txt
  else
      mvn package exec:exec -P $1  2>&1 | tee -a /root/Projects/c2wt/logs/log.txt
  fi
fi
