#!/usr/bin/env python3
import ssl
import os
import subprocess
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler
import socketserver
import http.client
import argparse
import socket
from urllib.parse import urlparse

# Increase timeout values
SOCKET_TIMEOUT = 300  # 5 minutes timeout

def create_self_signed_cert():
    """Create a self-signed certificate if one doesn't exist"""
    if not os.path.exists('server.crt') or not os.path.exists('server.key'):
        print("Generating self-signed certificate...")
        os.system('openssl req -x509 -newkey rsa:4096 -keyout server.key -out server.crt -days 365 -nodes -subj "/CN=localhost"')
        print("Certificate generated.")

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

def run_https_server(port=5002):
    """Run an HTTPS server that forwards to the backend"""
    create_self_signed_cert()
    
    # Set socket timeout globally
    socket.setdefaulttimeout(SOCKET_TIMEOUT)
    
    # Create HTTPS server with threading support
    httpd = ThreadedHTTPServer(('0.0.0.0', port), ProxyHandler)
    
    # Add SSL
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain(certfile='server.crt', keyfile='server.key')
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f"Starting HTTPS proxy server on port {port}")
    print(f"Forwarding requests to backend at http://127.0.0.1:5001")
    print(f"Using timeout of {SOCKET_TIMEOUT} seconds")
    print("To connect from your Swift app, use: https://<your-ip>:5002/api")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Shutting down HTTPS proxy server")
        httpd.server_close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='HTTPS wrapper for Nutrivize API')
    parser.add_argument('--port', type=int, default=5002, help='Port for HTTPS server (default: 5002)')
    parser.add_argument('--timeout', type=int, default=300, help='Timeout in seconds (default: 300)')
    args = parser.parse_args()
    
    # Update the global timeout if specified
    if args.timeout != 300:
        SOCKET_TIMEOUT = args.timeout
        
    run_https_server(port=args.port) 