#!/bin/bash

# Mindhaven Service Management Script

case "$1" in
    start)
        echo "Starting Mindhaven services..."
        # Kill any existing processes first
        pkill -f "expo start"
        pkill -f "proxy-server.js"
        sleep 2
        
        # Reload systemd configuration
        systemctl daemon-reload
        
        # Start services
        systemctl start mindhaven-expo.service
        sleep 5
        systemctl start mindhaven-https.service
        
        echo "Services started successfully!"
        ;;
    stop)
        echo "Stopping Mindhaven services..."
        systemctl stop mindhaven-https.service
        systemctl stop mindhaven-expo.service
        
        # Kill any remaining processes
        pkill -f "expo start"
        pkill -f "proxy-server.js"
        
        echo "Services stopped successfully!"
        ;;
    restart)
        echo "Restarting Mindhaven services..."
        $0 stop
        sleep 3
        $0 start
        ;;
    status)
        echo "=== Mindhaven Services Status ==="
        systemctl status mindhaven-expo.service --no-pager -l
        echo ""
        systemctl status mindhaven-https.service --no-pager -l
        echo ""
        echo "=== Port Status ==="
        netstat -tlnp | grep -E ':(8081|8443)' || echo "No services running on ports 8081/8443"
        echo ""
        echo "=== HTTPS Test ==="
        curl -k -s -o /dev/null -w "HTTPS Status: %{http_code}\n" https://localhost:8443 2>/dev/null || echo "HTTPS endpoint not responding"
        ;;
    enable)
        echo "Enabling Mindhaven services for automatic startup..."
        systemctl daemon-reload
        systemctl enable mindhaven-expo.service
        systemctl enable mindhaven-https.service
        echo "Services enabled for automatic startup on boot!"
        ;;
    disable)
        echo "Disabling Mindhaven services..."
        systemctl disable mindhaven-expo.service
        systemctl disable mindhaven-https.service
        echo "Services disabled!"
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|enable|disable}"
        echo ""
        echo "Commands:"
        echo "  start   - Start both Mindhaven services"
        echo "  stop    - Stop both Mindhaven services"
        echo "  restart - Restart both Mindhaven services"
        echo "  status  - Show status of both services and test endpoints"
        echo "  enable  - Enable services for automatic startup on boot"
        echo "  disable - Disable automatic startup"
        exit 1
        ;;
esac

exit 0 