from sqlalchemy import Column, Integer, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, registry, relationship
from ..models.account import Account

from ..db import Base, db_session

class Friend(Base):
	__tablename__ = 'friend'
	account_id1 = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)
	account_id2 = Column(Integer, ForeignKey('accounts.account_id'), primary_key=True)

	def __repr__(self):
		return f"<Friend account_id1={self.account_id1} account_id2={self.account_id2}>"


	@classmethod
	def all(cls):
		'''
		returns all friend pairs in the database
		'''
		return db_session.query(cls).all()


	@classmethod
	def get_pair_by_ids(cls, account_id1, account_id2):
		'''
		gets the friend pair from database according to the two friend account ids

		PARAMS: 
		- account_id1: id for first account in friend pair
		- account_id2: id for second account in friend pair

		RETURNS: 
		- the Friend object if found
		'''
		if account_id1 > account_id2:
			account_id1, account_id2 = account_id2, account_id1
		return db_session.query(cls).filter_by(account_id1=account_id1, account_id2=account_id2).first()


	@classmethod
	def get_friends_by_id(cls, account_id):
		'''
		gets all friends of the specified account 
		
		PARAMS: 
		- account_id: the account id to find all friends for

		RETURNS: 
		- friends: list of all the ids of the accounts the specified account is friends with
		'''
		try:
			friend_pairs = db_session.query(Friend).filter(
				(Friend.account_id1 == account_id) | (Friend.account_id2 == account_id)
			).all()

			friends = []
			for pair in friend_pairs:
				if pair.account_id1 != account_id:
					friend_id = pair.account_id1
				else:
					friend_id = pair.account_id2
				friend_acc = Account.get_acc_by_id(friend_id)
				if friend_acc:
					friends.append(friend_acc)
			return friends
		
		except Exception as e:
			print(f"Error fetching friends: {e}")
			return None		
		

	def save(self):
		'''
		saves a friend pair in the database
		'''
		db_session.add(self)
		db_session.commit()

	def delete(self):
		'''
		deletes a friend pair from the database
		  '''
		db_session.delete(self)
		db_session.commit()

	def to_dict(self):
		'''
		return a dictionary format of the account object 
		'''
		return {column.name: getattr(self, column.name) for column in self.__table__.columns}
