"""Independent checks that the detector numbers are real. Run from ml/: python3 audit.py

Recomputes the headline metrics, runs a shuffled-label leakage test, a subject-level
bootstrap, a recording-length shortcut test, single-feature baselines, and scores the
shipped recipe (UMAFall plus synthetic) honestly. Findings are written up in VALIDITY.md.
"""
import sys, csv, numpy as np
from pathlib import Path
from sklearn.metrics import roc_auc_score, precision_score, recall_score
from sklearn.model_selection import GroupKFold
from sklearn.ensemble import HistGradientBoostingClassifier
from data_umafall import load_all
from features import features, window_around_peak, FEATURE_NAMES
from synthetic import dataset

ML = Path(__file__).resolve().parent
rows = list(csv.DictReader(open(ML/"out/oof.csv")))
y = np.array([int(r["label"]) for r in rows]); p = np.array([float(r["p_gbm"]) for r in rows]); g = np.array([int(r["subject"]) for r in rows])
print("1. recompute from oof.csv: prec %.3f rec %.3f auc %.3f n=%d falls=%d" % (precision_score(y,p>=.5), recall_score(y,p>=.5), roc_auc_score(y,p), len(y), y.sum()))

rng = np.random.default_rng(0); subs = np.unique(g); R=[];P=[];A=[]
for _ in range(2000):
    b = rng.choice(subs, len(subs)); idx = np.concatenate([np.where(g==s)[0] for s in b])
    R.append(recall_score(y[idx],p[idx]>=.5)); P.append(precision_score(y[idx],p[idx]>=.5)); A.append(roc_auc_score(y[idx],p[idx]))
ci=lambda v: "[%.3f, %.3f]"%tuple(np.percentile(v,[2.5,97.5]))
print("2. subject-cluster bootstrap: recall", ci(R), "precision", ci(P), "auroc", ci(A))
print("   per-subject recall:", {int(s): round(recall_score(y[g==s],p[g==s]>=.5),2) for s in subs if y[g==s].sum()>0})
print("   subjects with no falls:", [int(s) for s in subs if y[g==s].sum()==0])

trials = [t for t in load_all(ML/"data/umafall") if "phone" in t.signals]
W = [window_around_peak(t.signals["phone"]) for t in trials]
X = np.array([features(w) for w in W]); Y = np.array([t.label for t in trials]); G = np.array([t.subject for t in trials])
dur = np.array([w[-1,0]-w[0,0] for w in W]); rec = np.array([t.signals["phone"][-1,0] for t in trials])
for lab in (0,1): print("3. label %d: window s median %.2f (min %.2f) | recording s median %.1f (min %.1f, max %.1f)" % (lab, np.median(dur[Y==lab]), dur[Y==lab].min(), np.median(rec[Y==lab]), rec[Y==lab].min(), rec[Y==lab].max()))
print("   AUROC of window length alone %.3f, recording length alone %.3f" % (roc_auc_score(Y,dur), roc_auc_score(Y,rec)))
print("4. single-feature AUROC:", {n: round(max(roc_auc_score(Y,X[:,i]),1-roc_auc_score(Y,X[:,i])),3) for i,n in enumerate(FEATURE_NAMES)})

def cv(Xm, Ym):
    o=np.zeros(len(Ym))
    for tr,te in GroupKFold(5).split(Xm,Ym,G):
        o[te]=HistGradientBoostingClassifier(max_depth=3,learning_rate=0.08,max_iter=200,class_weight="balanced",random_state=0).fit(Xm[tr],Ym[tr]).predict_proba(Xm[te])[:,1]
    return o
o=cv(X,Y); print("5. rerun CV from raw data: auc %.3f rec %.3f prec %.3f" % (roc_auc_score(Y,o), recall_score(Y,o>=.5), precision_score(Y,o>=.5)))
perm=[roc_auc_score(Yp:=rng.permutation(Y), cv(X,Yp)) for _ in range(5)]
print("6. shuffled-label CV AUROC (should be ~0.5):", np.round(perm,3))

Xs_w, ys, names = dataset(n_per=150); Xs=np.array([features(w) for w in Xs_w])
full = HistGradientBoostingClassifier(max_depth=3,learning_rate=0.08,max_iter=200,class_weight="balanced",random_state=0).fit(np.vstack([X,Xs]),np.concatenate([Y,ys]))
ps=full.predict_proba(Xs)[:,1]
print("7. SHIPPED model (UMAFall+synthetic) on its own synthetic training set, flagged:", {n: round(float(np.mean(ps[np.array(names)==n]>=.5)),2) for n in sorted(set(names))})
Xs2_w, ys2, n2 = dataset(n_per=150, seed=123) if "seed" in dataset.__code__.co_varnames else (None,None,None)
if Xs2_w is not None:
    ps2=full.predict_proba(np.array([features(w) for w in Xs2_w]))[:,1]
    print("   on a FRESH synthetic draw (seed 123):", {n: round(float(np.mean(ps2[np.array(n2)==n]>=.5)),2) for n in sorted(set(n2))})
print("8. activities:", sorted(set(t.activity for t in trials)))



A_w,ya,na=Xs_w,ys,names;XA=np.array([features(w) for w in A_w])
B_w,yb,nb=dataset(n_per=150,seed=123);XB=np.array([features(w) for w in B_w]);nb=np.array(nb)
from sklearn.ensemble import HistGradientBoostingClassifier as H
mk=lambda:H(max_depth=3,learning_rate=0.08,max_iter=200,class_weight="balanced",random_state=0)
o=np.zeros(len(Y))
for tr,te in GroupKFold(5).split(X,Y,G):
    o[te]=mk().fit(np.vstack([X[tr],XA]),np.concatenate([Y[tr],ya])).predict_proba(X[te])[:,1]
print("shipped recipe (UMAFall folds + synthetic) on held-out UMAFall subjects: auc %.3f rec %.3f prec %.3f"%(roc_auc_score(Y,o),recall_score(Y,o>=.5),precision_score(Y,o>=.5)))
u=mk().fit(X,Y).predict_proba(XB)[:,1]
print("UMAFall-only model on fresh synthetic:",{n:round(float(np.mean(u[nb==n]>=.5)),2) for n in sorted(set(nb))})
