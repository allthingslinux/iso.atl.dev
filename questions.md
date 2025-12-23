
user uploads file

some file validation happens here
	- what even do we seek to validate in terms of "hard" validators
	- how do we leverage client side validations of the file to avoid needing server resources

file goes into staging (enum) (status)
- file gets added to database (action)
- file goes into processing queue (ux/ui)

system enriches file metadata possibly via automation

user enriches file metadata via manual contributios

file reaches some completion level %

file goes into reviewing queue (not always)

trusted member/staff/admins/etc approves file contributions
	- "trusted member" - members with certain level/rank due to # of good contributions

file gets renamed/moves out of staging to proper directory structure expectations ($token based)

