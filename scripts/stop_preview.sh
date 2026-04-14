#!/bin/bash
# Stop the simple preview server
pkill -f "python3 -m http.server 8080"
if [ $? -eq 0 ]; then
    echo "Preview server stopped."
else
    echo "Preview server is not running or could not be stopped."
fi
