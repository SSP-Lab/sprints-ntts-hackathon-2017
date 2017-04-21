# -*- coding: utf-8 -*-
# Flask
from flask import Flask
from flask import render_template
import json
# Calculs
import pandas as pd
import numpy as np
import scipy as sp
import xarray as xr

data_path = './input/'
#n_samples = 1000 # DEBUG 

app = Flask(__name__)

@app.route("/data")
def get_data():
    df = pd.read_csv(data_path +'lbc_clean_sample45000.csv',quoting=1,encoding='utf8',escapechar="\\",low_memory=False,index_col=0)
    #df= df[:n_samples]
    cols_to_keep = ['date_clean', 'longitude', 'latitude', 'sect', 'tps','contrat', 'commune_dep','exp','formation','fonction']
    df = df.loc[((df['latitude']==df['latitude'])&(df['longitude']==df['longitude']))]
    df = df.fillna('n.s.')
    df_clean = df[cols_to_keep]
    df_clean.columns =  ['date_clean', 'long', 'lat', 'sect', 'tps','contrat', 'dep','exp','formation','fonction']
    return df_clean.to_json(orient='records')

@app.route("/")
def index():
    return render_template("index.html")

if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)