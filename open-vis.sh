# Starts a simple python HTTP server, then opens safari with the visualization webpage.

python -m SimpleHTTPServer 8888 &
open -a "Safari" http://localhost:8888

echo "Type \"kill -9 $!\" to stop HTTP server"
