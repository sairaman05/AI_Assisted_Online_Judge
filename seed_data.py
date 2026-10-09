import pymongo

client = pymongo.MongoClient('mongodb://127.0.0.1:27017/')
db = client['online_judge']
users = db['users']
user = users.find_one({'email': 'vignesh@example.com'})

if not user:
    # create user if not existing
    import bcrypt
    pwd_hash = bcrypt.hashpw(b'password123', bcrypt.gensalt()).decode('utf-8')
    user_id = 'user_admin_01'
    users.insert_one({
        'id': user_id,
        'name': 'Vigneshwarran S',
        'email': 'vignesh@example.com',
        'password': pwd_hash,
        'type': 'admin',
        'rating': 1580,
        'streak': 14,
        'stats': {'easySolved': 18, 'mediumSolved': 12, 'hardSolved': 5},
        'weakTopics': ['Dynamic Programming', 'Segment Trees', 'Bit Manipulation'],
        'topicProgress': {
            'Arrays': {'solved': 10, 'total': 12},
            'Dynamic Programming': {'solved': 3, 'total': 9},
            'Graphs': {'solved': 5, 'total': 7},
            'Trees': {'solved': 6, 'total': 8}
        }
    })
    print("Created new admin user!")
else:
    users.update_one(
        {'_id': user['_id']},
        {'$set': {
            'name': 'Vigneshwarran S',
            'type': 'admin',
            'rating': 1580,
            'streak': 14,
            'stats': {'easySolved': 18, 'mediumSolved': 12, 'hardSolved': 5},
            'weakTopics': ['Dynamic Programming', 'Segment Trees', 'Bit Manipulation'],
            'topicProgress': {
                'Arrays': {'solved': 10, 'total': 12},
                'Dynamic Programming': {'solved': 3, 'total': 9},
                'Graphs': {'solved': 5, 'total': 7},
                'Trees': {'solved': 6, 'total': 8}
            }
        }}
    )
    print("Updated admin user successfully!")
