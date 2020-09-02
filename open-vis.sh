# Starts a simple python HTTP server, then opens safari with the visualization webpage.

port=8888
kill=0
while getopts ":k" arg
do
  case $arg in
    k) echo "got kill option";;
    p) port=$OPTARG;;
  esac
done

python -m SimpleHTTPServer $port &
sleep 0.2
open http://localhost:$port

echo "kill = $kill"
if [ $kill -eq 1 ]
then
    sleep 0.2
    echo "Killing HTTP server..."
    kill -9 $!
else
    echo "Type \"kill -9 $!\" (or \"kill -9 \$!\") to stop HTTP server"
fi
