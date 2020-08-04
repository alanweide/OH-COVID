# Starts a simple python HTTP server, then opens safari with the visualization webpage.

port=8888
if [ ! -z "$1" ]
then
    echo $1
    port=$1
fi
python -m SimpleHTTPServer $port &
sleep 0.1
open http://localhost:$port

echo "Type \"kill -9 $!\" to stop HTTP server"
