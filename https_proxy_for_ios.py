#!/usr/bin/env python3
import ssl
import os
import subprocess
import socket
import json
from http.server import HTTPServer, SimpleHTTPRequestHandler
import socketserver
import http.client
import argparse
from urllib.parse import urlparse
import sys

# Timeout value (10 minutes)
SOCKET_TIMEOUT = 600

def get_local_ip():
    """Get the local IP address of this machine"""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.connect(('8.8.8.8', 80))
    ip = s.getsockname()[0]
    s.close()
    return ip

def create_self_signed_cert(ip_address):
    """Create a self-signed certificate with the IP address in the CN and SAN fields"""
    if not os.path.exists('ssl_cert') or not os.path.exists('ssl_key'):
        print("Generating self-signed certificate with your IP address...")
        
        # Create config file for OpenSSL
        with open('openssl.cnf', 'w') as f:
            f.write(f"""[req]
distinguished_name = req_distinguished_name
req_extensions = v3_req
prompt = no

[req_distinguished_name]
CN = {ip_address}

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
IP.1 = {ip_address}
DNS.1 = {ip_address}
DNS.2 = localhost
""")
        
        # Generate the certificate using the config file
        os.system(f'openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout ssl_key -out ssl_cert -config openssl.cnf')
        print("Certificate generated with your IP address in CN/SAN fields.")

class ProxyHandler(SimpleHTTPRequestHandler):
    # Increase the timeout for handling requests
    timeout = SOCKET_TIMEOUT
    
    def do_GET(self):
        self.proxy_request('GET')
    
    def do_POST(self):
        self.proxy_request('POST')
        
    def do_PUT(self):
        self.proxy_request('PUT')
        
    def do_DELETE(self):
        self.proxy_request('DELETE')
        
    def proxy_request(self, method):
        """Forward the request to the backend server"""
        target_host = '127.0.0.1'
        target_port = 5001
        
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length) if content_length > 0 else None
        
        # Create connection to the backend server with longer timeout
        conn = http.client.HTTPConnection(target_host, target_port, timeout=SOCKET_TIMEOUT)
        
        # Copy headers
        headers = {}
        for key, value in self.headers.items():
            if key.lower() not in ('host', 'content-length'):
                headers[key] = value
        
        # Make the request to the backend
        try:
            print(f"Forwarding {method} request to backend: {self.path}")
            conn.request(method, self.path, body=body, headers=headers)
            response = conn.getresponse()
            
            # Copy response status and headers
            self.send_response(response.status)
            for key, value in response.getheaders():
                if key.lower() != 'transfer-encoding':
                    self.send_header(key, value)
            self.end_headers()
            
            # Send the response body
            response_data = response.read()
            print(f"Backend responded with status {response.status} and {len(response_data)} bytes")
            self.wfile.write(response_data)
        except Exception as e:
            print(f"Error proxying request: {str(e)}")
            self.send_error(502, f"Proxy Error: {str(e)}")
        finally:
            conn.close()

class ThreadedHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    """Handle requests in a separate thread."""
    daemon_threads = True

def main():
    parser = argparse.ArgumentParser(description='HTTPS proxy for iOS development')
    parser.add_argument('--port', type=int, default=5002, help='Port for HTTPS server (default: 5002)')
    parser.add_argument('--timeout', type=int, default=600, help='Timeout in seconds (default: 600)')
    args = parser.parse_args()
    
    # Update the global timeout if specified
    global SOCKET_TIMEOUT
    if args.timeout != 600:
        SOCKET_TIMEOUT = args.timeout
    
    # Get the local IP address
    ip_address = get_local_ip()
    
    # Create a certificate with the IP address
    create_self_signed_cert(ip_address)
    
    # Set socket timeout globally
    socket.setdefaulttimeout(SOCKET_TIMEOUT)
    
    # Create HTTPS server with threading support
    server_address = ('0.0.0.0', args.port)
    httpd = ThreadedHTTPServer(server_address, ProxyHandler)
    
    # Add SSL
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile='ssl_cert', keyfile='ssl_key')
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print("\n===== HTTPS PROXY FOR iOS =====")
    print(f"Starting HTTPS proxy server on port {args.port}")
    print(f"Using timeout of {SOCKET_TIMEOUT} seconds")
    print(f"Forwarding requests to backend at http://127.0.0.1:5001")
    print(f"\nIMPORTANT: Update your Swift app to use: https://{ip_address}:{args.port}/api")
    print(f"\nIn NutrivizeAPIClient.swift, set:")
    print("private let deviceURLs = [")
    print(f'    "https://{ip_address}:{args.port}/api",  // iOS-compatible HTTPS')
    print('    "http://192.168.4.124:5001/api",  // Fallback direct HTTP')
    print("]")
    print("\nWhen testing on your iOS device:")
    print("1. Make sure your iOS device is on the same WiFi network as this computer")
    print("2. When first connecting, you'll need to accept the certificate warning")
    print("3. In iOS Settings, go to General > About > Certificate Trust Settings")
    print("4. Enable full trust for the SSL certificate")
    print("\nPress Ctrl+C to stop the server")
    print("==============================\n")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down HTTPS proxy server")
        httpd.server_close()
        print("Server stopped")

if __name__ == "__main__":
    main() 