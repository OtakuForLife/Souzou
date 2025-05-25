#!/usr/bin/env python3
"""
Setup script for the theme system
Run this from the project root directory
"""

import os
import sys
import subprocess

def run_command(command, cwd=None):
    """Run a command and return success status"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, check=True, capture_output=True, text=True)
        print(f"✅ {command}")
        if result.stdout:
            print(f"   Output: {result.stdout.strip()}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {command}")
        print(f"   Error: {e.stderr.strip()}")
        return False

def main():
    print("🎨 Setting up Theme System...")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists('backend/manage.py'):
        print("❌ Please run this script from the project root directory")
        sys.exit(1)
    
    # Step 1: Create and run Django migrations
    print("\n📦 Creating Django migrations...")
    backend_dir = 'backend'
    
    if not run_command('python manage.py makemigrations api', cwd=backend_dir):
        print("❌ Failed to create migrations")
        sys.exit(1)
    
    print("\n🔄 Running Django migrations...")
    if not run_command('python manage.py migrate', cwd=backend_dir):
        print("❌ Failed to run migrations")
        sys.exit(1)
    
    # Step 2: Create default themes
    print("\n🎨 Creating default themes...")
    if not run_command('python manage.py create_default_themes', cwd=backend_dir):
        print("❌ Failed to create default themes")
        sys.exit(1)
    
    # Step 3: Install frontend dependencies (if needed)
    print("\n📦 Checking frontend dependencies...")
    frontend_dir = 'frontend'
    
    # Check if node_modules exists
    if not os.path.exists(os.path.join(frontend_dir, 'node_modules')):
        print("Installing frontend dependencies...")
        if not run_command('npm install', cwd=frontend_dir):
            print("❌ Failed to install frontend dependencies")
            sys.exit(1)
    else:
        print("✅ Frontend dependencies already installed")
    
    print("\n" + "=" * 50)
    print("🎉 Theme system setup complete!")
    print("\nNext steps:")
    print("1. Start the Django backend: cd backend && python manage.py runserver")
    print("2. Start the React frontend: cd frontend && npm run dev")
    print("3. Open your app and check the theme settings!")
    print("\nThe following themes are now available:")
    print("- Light (default)")
    print("- Dark")
    print("- High Contrast")

if __name__ == '__main__':
    main()
