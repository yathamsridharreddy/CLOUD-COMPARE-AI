#!/usr/bin/env python3
"""
Simple HTTP server for CloudCompare AI frontend with SPA routing support
"""
import os
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler

class SPARequestHandler(SimpleHTTPRequestHandler):
    """HTTP request handler that supports SPA routing"""
    
    def do_GET(self):
        # Try to serve the file first
        path = self.translate_path(self.path)
        
        # If it's a directory, try index.html
        if os.path.isdir(path):
            self.path = os.path.join(self.path, 'index.html').replace('\\', '/')
            path = self.translate_path(self.path)
        
        # If file doesn't exist, route to SPA index.html
        if not os.path.exists(path):
            # Check if it looks like a static asset file
            is_static_asset = any(self.path.endswith(ext) for ext in [
                '.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', 
                '.woff', '.woff2', '.ttf', '.eot', '.map'
            ])
            
            # If not a static asset, route to app index.html for SPA routing
            if not is_static_asset:
                self.path = '/app/index.html'
        
        return super().do_GET()
    
    def end_headers(self):
        # Add cache control headers
        if self.path.endswith(('.js', '.css')):
            self.send_header('Cache-Control', 'public, max-age=3600')
        else:
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        return super().end_headers()

def run_server(port=3000):
    os.chdir('/Users/yathamsridharreddy/Desktop/INTERNSHIP-PROJECT/CLOUD-COMPARE-AI/cloudcompare-frontend/dist')
    server_address = ('', port)
    httpd = HTTPServer(server_address, SPARequestHandler)
    print(f'Starting CloudCompare AI frontend server on port {port}')
    print(f'Access at: http://localhost:{port}/')
    print(f'Serving from: {os.getcwd()}')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
        sys.exit(0)

if __name__ == '__main__':
    run_server()
