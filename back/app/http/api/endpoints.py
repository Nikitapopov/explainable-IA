from flask import Flask, json, request, send_file
from flask_cors import CORS

import pandas as pd
# import sklearn
from interpret.blackbox import ShapKernel, LimeTabular, PartialDependence, MorrisSensitivity
from interpret.data import ClassHistogram
from sklearn.model_selection import train_test_split
import joblib
import plotly.express as px
import xgboost
import matplotlib.pyplot as plt
import uuid
import time
import json
import enum
import os

import lime
import lime.lime_tabular
import shap
from shapash.explainer.smart_explainer import SmartExplainer
import dalex as dx
from interpret import show
from interpret.glassbox import ExplainableBoostingClassifier, LogisticRegression, ClassificationTree, \
    DecisionListClassifier

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = '/temp'
ALLOWED_EXTENSIONS = {'pkl', 'csv'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

SHORT_HTML_FILE_PATH = "../../../temp/reports/"
HTML_FILE_PATH = "./temp/reports/"  # file.html"
DATA_CSV_PATH = './temp/data/data.csv'
MODEL_PATH = "./temp/model/model.pkl"
HTML_EXTENSION = "html"
PDF_EXTENSION = "pdf"

@app.route("/data-count", methods=["GET"])
def reports_count():
    is_exists = os.path.isfile(MODEL_PATH)
    if is_exists:
        df = pd.read_csv(DATA_CSV_PATH)
        return str(df.shape[0])
    else:
        return -1


@app.route("/upload-model", methods=["POST"])
def upload_model():
    file = request.files['file']
    if file and allowed_file(file.filename):
        file.save('temp/model/model.pkl')
    return 'OK'

@app.route("/upload-data", methods=["POST"])
def upload_data():
    print("upload_data")
    file = request.files['file']
    print(file)
    if file and allowed_file(file.filename):
        file.save('temp/data/data.csv')
    return 'OK'

@app.route("/check-model-downloaded", methods=["GET"])
def check_model_downloaded():
    result = os.path.isfile(MODEL_PATH)
    return str(result)

@app.route("/check-data-downloaded", methods=["GET"])
def check_data_downloaded():
    result = os.path.isfile(DATA_CSV_PATH)
    print(result)
    return str(result)


@app.route("/lime", methods=["POST"])
def interpret_lime():
    instance_number = request.json.get('instance_number')
    if instance_number:
        instance_number = int(instance_number)

    X, y, model = get_data_and_model()

    start = time.time()
    explainer = lime.lime_tabular.LimeTabularExplainer(
        X.to_numpy(),
        feature_names=X.columns,
        class_names=['0', '1'],
        verbose=True
    )

    exp = explainer.explain_instance(X.values[instance_number], model.predict_proba)  # _proba)#, num_features=20)
    end = time.time()

    file_id = str(uuid.uuid4())
    exp.save_to_file(HTML_FILE_PATH + file_id + '.' + HTML_EXTENSION)
    return json.dumps({
        "time": round(end - start, 6),
        "token": file_id,
        "extension": HTML_EXTENSION
    })


class ShapPlot(enum.Enum):
    summary_plot = 'summary plot'
    bar = 'bar'
    waterfall = 'waterfall'
    scatter = 'scatter'
    force = 'force'


@app.route("/shap", methods=["POST"])
def interpret_shap():
    plot = request.json.get('plot')
    instance_number = request.json.get('instance_number')
    if instance_number:
        instance_number = int(instance_number)

    X, y, model = get_data_and_model()

    start = time.time()
    if plot == ShapPlot.summary_plot.value:
        explainer = shap.Explainer(model, X)
        shap_values = explainer(X)

        shap.summary_plot(shap_values, X, title="SHAP summary plot", show=False)

    elif plot == ShapPlot.bar.value:
        explainer = shap.Explainer(model, X)
        shap_values = explainer(X)

        if instance_number is not '':
            shap.plots.bar(shap_values[instance_number], show=False)
        else:
            shap.plots.bar(shap_values, show=False)

    elif plot == ShapPlot.waterfall.value:
        explainer = shap.Explainer(model, X)
        shap_values = explainer(X)

        shap.waterfall_plot(shap_values[instance_number], show=False)

    elif plot == ShapPlot.scatter.value:
        explainer = shap.Explainer(model, X)
        shap_values = explainer(X)

        shap.plots.scatter(shap_values[instance_number], show=False)

    elif plot == ShapPlot.force.value:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X)
        expected_value = explainer.expected_value
        shap.force_plot(expected_value, shap_values[instance_number, :], show=False)

    end = time.time()

    file_id = str(uuid.uuid4())
    plt.savefig(HTML_FILE_PATH + file_id + '.' + PDF_EXTENSION)
    return json.dumps({
        "time": round(end - start, 6),
        "token": file_id,
        "extension": PDF_EXTENSION
    })


class ShapashPlot(enum.Enum):
    compacity = 'compacity'
    contribution = 'contribution'
    features_importance = 'features importance'
    local_neighbors = 'local neighbors'
    local = 'local'
    top_interactions = 'top interactions'


@app.route("/shapash", methods=["POST"])
def interpret_shapash():
    plot = request.json.get('plot')
    instance_number = request.json.get('instance_number')
    if instance_number:
        instance_number = int(instance_number)

    X, y, model = get_data_and_model()

    start = time.time()
    xpl = SmartExplainer()
    xpl.compile(x=X, model=model)

    if plot == ShapashPlot.compacity.value:
        my_plot = xpl.plot.compacity_plot(auto_open=False)

    elif plot == ShapashPlot.contribution.value:  # Номер или название столбца
        my_plot = xpl.plot.contribution_plot(1, auto_open=False)

    elif plot == ShapashPlot.features_importance.value:
        my_plot = xpl.plot.features_importance(auto_open=False)

    elif plot == ShapashPlot.local_neighbors.value:
        my_plot = xpl.plot.local_neighbors_plot(instance_number, auto_open=False)

    elif plot == ShapashPlot.local.value:
        my_plot = xpl.plot.local_plot(auto_open=False, row_num=instance_number)

    elif plot == ShapashPlot.top_interactions.value:
        my_plot = xpl.plot.top_interactions_plot(auto_open=False)

    end = time.time()

    file_id = str(uuid.uuid4())
    my_plot.write_html(HTML_FILE_PATH + file_id + '.' + HTML_EXTENSION)

    return json.dumps({
        "time": round(end - start, 6),
        "token": file_id,
        "extension": HTML_EXTENSION
    })


class DalexPlot(enum.Enum):
    permutation_feature_importance = 'permutation feature importance'
    pdp = 'pdp'
    break_down = 'break down'
    shapley_values = 'shaplay values'
    lime = 'lime'


@app.route("/dalex", methods=["POST"])
def interpret_dalex():
    plot = request.json.get('plot')
    instance_number = request.json.get('instance_number')
    if instance_number:
        instance_number = int(instance_number)

    X, y, model = get_data_and_model()

    start = time.time()

    explainer = dx.Explainer(model, X, y)
    if plot == DalexPlot.permutation_feature_importance.value:
        fig = explainer.model_parts().plot(show=False)

    elif plot == DalexPlot.pdp.value:
        fig = explainer.model_profile(type='ale', label="pdp").plot(show=False)

    elif plot == DalexPlot.break_down.value:
        fig = explainer.predict_parts(X.iloc[instance_number, :]).plot(show=False)

    elif plot == DalexPlot.shapley_values.value:
        fig = explainer.predict_parts(X.iloc[instance_number, :], type="shap").plot(min_max=[0, 1], show=False)

    elif plot == DalexPlot.lime.value:
        fig = explainer.predict_surrogate(X.iloc[[instance_number]]).plot(show=False)

    end = time.time()

    file_id = str(uuid.uuid4())
    fig.write_html(HTML_FILE_PATH + file_id + '.' + HTML_EXTENSION)

    return json.dumps({
        "time": round(end - start, 6),
        "token": file_id,
        "extension": HTML_EXTENSION
    })


class InterpretMLPlot(enum.Enum):
    ebm='ebm'
    linear_model='linear model'
    decision_tree='decision tree'
    decision_rule='decision rule'
    shap='shap'
    lime='lime'
    pdp='pdp'
    morris='morris'


@app.route("/interpretML", methods=["POST"])
def interpret_interpret_ml():
    plot = request.json.get('plot')
    instance_number = request.json.get('instance_number')
    if instance_number:
        instance_number = int(instance_number)

    X, y, model = get_data_and_model()

    start = time.time()

    if (plot == InterpretMLPlot.ebm.value
            or plot == InterpretMLPlot.linear_model.value
            or plot == InterpretMLPlot.decision_tree.value
            or plot == InterpretMLPlot.decision_rule.value):

        if plot == InterpretMLPlot.ebm.value:
            model = ExplainableBoostingClassifier()

        elif plot == InterpretMLPlot.linear_model.value:
            model = LogisticRegression()

        elif plot == InterpretMLPlot.decision_tree.value:
            model = ClassificationTree()

        elif plot == InterpretMLPlot.decision_rule.value:
            model = DecisionListClassifier()

        model.fit(X, y)
        if instance_number == '':
            explainer = model.explain_global()
            fig = explainer.visualize()
        else:
            explainer = model.explain_local(X, y)
            fig = explainer.visualize(instance_number)

    else:
        if plot == InterpretMLPlot.shap.value:
            explainer_model = ShapKernel(predict_fn=model.predict_proba, data=X)
            explainer = explainer_model.explain_local(instance_number)
            fig = explainer.visualize()

        elif plot == InterpretMLPlot.lime.value:
            explainer_model = LimeTabular(predict_fn=model.predict_proba, data=X)
            explainer = explainer_model.explain_local(instance_number)
            fig = explainer.visualize()

        elif plot == InterpretMLPlot.pdp.value:
            explainer_model = PartialDependence(predict_fn=model.predict_proba, data=X)
            explainer = explainer_model.explain_global()
            fig = explainer.visualize()

        elif plot == InterpretMLPlot.morris.value:
            explainer_model = MorrisSensitivity(predict_fn=model.predict_proba, data=X)
            explainer = explainer_model.explain_global()
            fig = explainer.visualize()

    end = time.time()

    file_id = str(uuid.uuid4())
    fig.write_html(HTML_FILE_PATH + file_id + '.' + HTML_EXTENSION)

    return json.dumps({
        "time": round(end - start, 6),
        "token": file_id,
        "extension": HTML_EXTENSION
    })


@app.route("/interpretation-file/<token>/<interpretation_result>", methods=["GET"])
def download_report(token, interpretation_result):
    return send_file(SHORT_HTML_FILE_PATH + token + '.' + interpretation_result)


def get_data_and_model():
    df = pd.read_csv(DATA_CSV_PATH)

    X = df.drop(['cardio'], axis=1) \
        .drop(['id'], axis=1) \
        .drop(['BMI'], axis=1) \
        .drop(['rang'], axis=1) \
        .drop(['len'], axis=1)
    y = df[['cardio']]

    model = joblib.load(MODEL_PATH)

    return X, y, model

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1] in ALLOWED_EXTENSIONS