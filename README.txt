Read Me
----------------------------------------------------------

Project : movieapp-api


mLab MongoDB:
---------------------------
Database Name :	movieapp 
Region : Europe (Ireland) (eu-west-1) 
Connection String: mongodb://<dbuser>:<dbpassword>@ds149596.mlab.com:49596/movieapp
user: madhav
pass: db1988

import: mongoimport -h ds149596.mlab.com:49596 -d movieapp -c movies -u madhav -p db1988 --jsonArray --file imdb.json