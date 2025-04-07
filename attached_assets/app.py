from flask import Flask, render_template, request, redirect, url_for, session
from flask_sqlalchemy import SQLAlchemy
import random
import os
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'supersecretkey'  # Needed for session management

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///casino.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)
migrate = Migrate(app, db)

# Define a User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)  # Store hashed passwords
    balance = db.Column(db.Float, default=0.0)

@app.context_processor
def inject_user():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        return {'user': user}
    return {'user': None}

@app.route('/')
def home():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))
    user = User.query.get(user_id)
    return render_template('index.html', user=user)

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username and password:
            existing_user = User.query.filter_by(username=username).first()
            if not existing_user:
                hashed_password = generate_password_hash(password, method='sha256')
                new_user = User(username=username, password=hashed_password, balance=100.0)
                db.session.add(new_user)
                db.session.commit()
                return redirect(url_for('login'))
            else:
                return "Username already exists!", 400
    return render_template('auth/register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            return redirect(url_for('home'))
        else:
            return "Invalid username or password!", 401
    return render_template('auth/login.html')

@app.route('/logout')
def logout():
    session.pop('user_id', None)
    return redirect(url_for('login'))

@app.route('/roll-dice', methods=['GET', 'POST'])
def roll_dice():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))
    user = User.query.get(user_id)

    if request.method == 'POST':
        bet = request.form.get('bet')
        if not bet:
            return "Bet amount is required!", 400
        try:
            bet = float(bet)
        except ValueError:
            return "Invalid bet amount!", 400

        if bet < 1 or bet > user.balance:
            return "Bet must be between $1 and your current balance!", 400

        dice_roll = random.randint(1, 6)
        if dice_roll > 3:
            user.balance += bet
            result = f"You rolled a {dice_roll}. You win ${bet}!"
        else:
            user.balance -= bet
            result = f"You rolled a {dice_roll}. You lose ${bet}."
        db.session.commit()
        return render_template('dice.html', user=user, result=result)

    return render_template('dice.html', user=user)

@app.route('/slot-machine', methods=['GET', 'POST'])
def slot_machine():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))
    user = User.query.get(user_id)

    if request.method == 'POST':
        symbols = ["🍒", "🍋", "🍊", "🍉", "⭐", "💎"]
        reels = [random.choice(symbols) for _ in range(3)]

        if len(set(reels)) == 1:
            result = "Jackpot! You win $100!"
            user.balance += 100
        elif len(set(reels)) == 2:
            result = "Small win! You win $10!"
            user.balance += 10
        else:
            result = "You lose! Try again."
            user.balance -= 5

        db.session.commit()
        return render_template('slot_machine_result.html', reels=reels, result=result, user=user)

    return render_template('slot_machine.html', user=user)

@app.route('/poker', methods=['GET', 'POST'])
def poker():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))
    user = User.query.get(user_id)

    if request.method == 'POST':
        bet = request.form.get('bet')
        if not bet:
            return "Bet amount is required!", 400
        try:
            bet = float(bet)
        except ValueError:
            return "Invalid bet amount!", 400

        if bet < 1 or bet > user.balance:
            return "Bet must be between $1 and your current balance!", 400

        stage = session.get('stage', 0)
        community_cards = session.get('community_cards', [])
        deck = session.get('deck', [])

        if stage == 0:
            community_cards.extend([deck.pop() for _ in range(3)])
        elif stage == 1:
            community_cards.append(deck.pop())
        elif stage == 2:
            community_cards.append(deck.pop())
        else:
            player_hand = session.get('player_hand', [])
            winner = evaluate_poker_hand(player_hand, community_cards)
            if winner == "player":
                user.balance += bet
                result = f"You win ${bet}!"
            else:
                user.balance -= bet
                result = f"You lose ${bet}."
            db.session.commit()
            return render_template('poker_result.html', result=result, player_hand=player_hand, community_cards=community_cards)

        session['stage'] = stage + 1
        session['community_cards'] = community_cards
        session['deck'] = deck

        return render_template('poker_game.html', player_hand=session['player_hand'], community_cards=community_cards, user=user)

    deck = [f"{rank}{suit}" for rank in "23456789TJQKA" for suit in "♠♥♦♣"]
    random.shuffle(deck)
    player_hand = [deck.pop(), deck.pop()]
    community_cards = []

    session['deck'] = deck
    session['player_hand'] = player_hand
    session['community_cards'] = community_cards
    session['stage'] = 0

    return render_template('poker_game.html', player_hand=player_hand, community_cards=community_cards, user=user)

def evaluate_poker_hand(player_hand, community_cards):
    all_cards = player_hand + community_cards
    ranks = [card[:-1] for card in all_cards]
    if len(set(ranks)) < len(ranks):
        return "player"
    return "dealer"

@app.route('/blackjack', methods=['GET', 'POST'])
def blackjack():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))
    user = User.query.get(user_id)

    if request.method == 'POST':
        bet = request.form.get('bet')
        if not bet:
            return "Bet amount is required!", 400
        try:
            bet = float(bet)
        except ValueError:
            return "Invalid bet amount!", 400

        if bet < 1 or bet > user.balance:
            return "Bet must be between $1 and your current balance!", 400

        # Initialize the game
        deck = session.get('deck', [2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10, 10, 11] * 4)
        random.shuffle(deck)
        player_hand = session.get('player_hand', [deck.pop(), deck.pop()])
        dealer_hand = session.get('dealer_hand', [deck.pop(), deck.pop()])

        # Save game state
        session['deck'] = deck
        session['player_hand'] = player_hand
        session['dealer_hand'] = dealer_hand

        # Game logic
        player_total = sum(player_hand)
        dealer_total = sum(dealer_hand)

        if player_total > 21:
            user.balance -= bet
            result = f"You busted! Dealer wins. Your hand: {player_hand}, Dealer's hand: {dealer_hand}"
        elif dealer_total > 21 or player_total > dealer_total:
            user.balance += bet
            result = f"You win! Your hand: {player_hand}, Dealer's hand: {dealer_hand}"
        elif player_total < dealer_total:
            user.balance -= bet
            result = f"Dealer wins! Your hand: {player_hand}, Dealer's hand: {dealer_hand}"
        else:
            result = f"It's a tie! Your hand: {player_hand}, Dealer's hand: {dealer_hand}"

        db.session.commit()
        return render_template('blackjack_game.html', user=user, result=result, player_hand=player_hand, dealer_hand=dealer_hand)

    # Render the game page with the bet form
    return render_template('blackjack_game.html', user=user)

@app.route('/games')
def games():
    user_id = session.get('user_id')
    if not user_id:
        return redirect(url_for('login'))
    user = User.query.get(user_id)
    return render_template('games/games.html', user=user)  # Matches the current location

if __name__ == '__main__':
    if not os.path.exists('casino.db'):
        with app.app_context():
            db.create_all()
    app.run(debug=True)

