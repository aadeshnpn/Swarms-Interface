ip=`hostname -I | cut -d " " -f 1`

while getopts "h?p:" opt; do
    case "$opt" in
    h|\?)
        show_help
        exit 0
        ;;
    p)  port=$OPTARG
        ;;
    esac
done

shift $((OPTIND-1))

printf "Starting server...\n"

nodejs viewer/index.js &

if [[ $? -ne 0 ]]; then
  printf "\n\t[!] Error starting server!\n"
  exit 1
fi

#nodePid=$!

printf "Waiting for server socket...\n"

while [[ ! -e "/tmp/honeybee-sim.viewerServer" ]]; do
  :
done

printf "Starting sim...\n"

python3.5 environment_code/Environment.py &

if [[ $? -ne 0 ]]; then
  printf "\n\t[!] Error starting sim!\n\n"
#  kill $nodePid
  exit 1
fi

printf "Simulation launched. Direct a browser to $ip:3000\n"

trap `kill $(jobs -p)` EXIT

wait
