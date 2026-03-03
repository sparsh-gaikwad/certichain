# 📜 Block-Based Certificate Verification System

## 👨‍💻 Project Overview

The **Block-Based Certificate Verification System** is a secure and tamper-proof platform designed to issue and verify academic and professional certificates using blockchain principles.

Traditional certificate verification methods are slow, manual, and vulnerable to forgery. This system ensures:

* 🔒 Data Integrity
* ⚡ Instant Verification
* 🛡️ Fraud Prevention
* 🌐 Transparency

---

## 📌 Project Details

* **Student Name:** Sparsh Gaikwad
* **Course:** BCA – Semester VI
* **Session:** 2025–2026
* **Guide:** Prof. Atul Thawre
* **Institution:** Datta Meghe Institute of Higher Education & Research (DMIHER), Wardha

---

## 🚀 Tech Stack

### 🎨 Frontend

* HTML
* CSS
* JavaScript

### ⚙️ Backend

* FastAPI (Python)

### 🗄️ Database

* MySQL (Aiven Cloud Database)

### 🔐 Security

* SHA-256 Hashing
* Blockchain-based hash storage concept

---

## 🎯 Objectives

* Prevent certificate forgery and fraud
* Enable instant online verification
* Ensure data immutability
* Reduce administrative workload
* Provide secure access to authorized users

---

## 🏗️ System Architecture

The system consists of three main modules:

1. **Certificate Issuing Authority**

   * Uploads certificate details
   * Generates cryptographic hash

2. **Blockchain Layer (Concept Implementation)**

   * Stores certificate hash
   * Ensures tamper-proof validation

3. **Verification Portal**

   * Re-hashes uploaded certificate
   * Matches with stored blockchain hash
   * Displays verification result

---

## 🔄 Workflow

1. Certificate details are entered by authorized authority.
2. SHA-256 hash of the certificate is generated.
3. Hash is stored securely in the database/blockchain layer.
4. During verification:

   * Certificate is uploaded
   * Hash is generated again
   * Compared with stored hash
   * If matched → Certificate is Authentic ✅
   * If not matched → Certificate is Invalid ❌

---

## 📂 Project Structure (Example)

```
Block-Certificate-Verification/
│
├── frontend/
│   ├── index.html
│   ├── verify.html
│   ├── style.css
│   └── script.js
│
├── backend/
│   ├── main.py
│   ├── models.py
│   ├── database.py
│   └── requirements.txt
│
└── README.md
```

---

## 💻 Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/sparsh-gaikwad/certichain.git
cd block-certificate-verification
```

---

### 2️⃣ Backend Setup (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend will run on:

```
http://127.0.0.1:8000
```

---

### 3️⃣ Database Setup

* Create MySQL database in **Aiven**
* Update database credentials inside `database.py`
* Ensure connection string format:

```python
mysql+pymysql://username:password@host:port/dbname
```

---

### 4️⃣ Frontend Setup

Simply open:

```
frontend/index.html
```

Or use Live Server extension in VS Code.

---

## 📊 Applications

* Educational Institutions
* Government Organizations
* Corporate HR Recruitment
* Online Certification Platforms
* Licensing Authorities

---

## 🖥️ Software Requirements

* Python 3.9+
* MySQL (Aiven Cloud)
* Web Browser (Chrome/Edge)
* VS Code / Any IDE

## 🛠️ Hardware Requirements

* Computer System
* Stable Internet Connection

---

## 📈 Expected Outcomes

* Tamper-proof certificate storage
* Real-time verification
* Reduced fake certificates
* Increased transparency
* Cost & time efficiency

---

## 📚 References

* Satoshi Nakamoto, *Bitcoin: A Peer-to-Peer Electronic Cash System*
* IEEE Research Papers (2023–2025) on Blockchain in Education
* Ethereum Documentation
* Hyperledger Documentation

---

## 🤝 Contribution

This project is developed as part of BCA Semester VI academic curriculum. Contributions, suggestions, and improvements are welcome.

---

## 📜 License

This project is developed for academic purposes.

---

⭐ If you like this project, don’t forget to star the repository!
