printf '\e[1;32m%-6s\e[m' "Skedit dev run at $(date +"%T")"
printf "\n"
"$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"/node_modules/.bin/electron "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
printf '\e[1;31m%-6s\e[m' "Exitted"
printf "\n"