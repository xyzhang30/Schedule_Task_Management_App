from werkzeug.utils import secure_filename
from ..__init__ import uploadParameters
import os

def create_file_name(username, file):
    if allowed_file(file.filename): #Check the original file they uploaded
        filename = "avatar" + username + '.' + secure_filename(file.filename).rsplit('.', 1)[1].lower() #Create a unique filename with username + extension of original file
        return filename
    else: 
        return None
def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in uploadParameters['ALLOWED_EXTENSIONS']
def upload_file(file, filename):
    file.save(os.path.join(uploadParameters['UPLOAD_FOLDER'], filename))
def delete_file(filename):
    filepath = os.path.join(uploadParameters['UPLOAD_FOLDER'], filename)
    os.remove(filepath)
