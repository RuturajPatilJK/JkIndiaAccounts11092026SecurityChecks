# # run.py

from app import app, socketio

if __name__ == "__main__":
    socketio.run(app, host='localhost', port=8080, debug=True, allow_unsafe_werkzeug=True)



