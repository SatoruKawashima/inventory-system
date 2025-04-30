function displayData() {
    let transaction = db.transaction(["scannedData"], "readonly");
    let store = transaction.objectStore("scannedData");
    let request = store.getAll();

    request.onsuccess = function(event) {
        let records = event.target.result;
        let tableBody = document.getElementById("dataTable").querySelector("tbody");
        tableBody.innerHTML = ""; // いったんテーブルを空にする

        records.forEach(record => {
            let row = tableBody.insertRow();

            row.insertCell().textContent = record.id;
            row.insertCell().textContent = record.productCode;
            row.insertCell().textContent = record.processCode;
            row.insertCell().textContent = record.quantity;
            row.insertCell().textContent = formatDateToLocal(record.timestamp);

            // 編集ボタン
            let editBtn = document.createElement("button");
            editBtn.textContent = "編集";
            editBtn.onclick = function() {
                openEditModal(record.id, record.quantity);
            };
            row.insertCell().appendChild(editBtn);

            // 削除ボタン（これは既存のもの）
            let deleteBtn = document.createElement("button");
            deleteBtn.textContent = "削除";
            deleteBtn.onclick = function() {
                openDeleteModal(record.id);
            };
            row.insertCell().appendChild(deleteBtn);
        });
    };
}

// 削除用の関数
function deleteRecord(id) {
    let transaction = db.transaction(["scannedData"], "readwrite");
    let store = transaction.objectStore("scannedData");
    let request = store.delete(id);

    request.onsuccess = function() {
        alert("データを削除しました！");
        displayData(); // 削除後に一覧を再描画
    };
}

// UTC表記の文字列をローカル時間（日本時間）に変換する関数
function formatDateToLocal(utcString) {
    let date = new Date(utcString);
    
    // ローカル時間で整形（YYYY-MM-DD HH:MM:SS形式にする）
    let year = date.getFullYear();
    let month = ('0' + (date.getMonth() + 1)).slice(-2);
    let day = ('0' + date.getDate()).slice(-2);
    let hours = ('0' + date.getHours()).slice(-2);
    let minutes = ('0' + date.getMinutes()).slice(-2);
    let seconds = ('0' + date.getSeconds()).slice(-2);

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

document.getElementById('scanBtn').addEventListener('click', () => {
    // 仮で読み取った品番と工程番号を作成
    let productCode = "ABC123";
    let processCode = "P001";

    // 数量をポップアップで入力
    openModal();

    if (quantity !== null && quantity !== "") {
        // IndexedDB保存処理（ここはまだ仮）
        saveData(productCode, processCode, quantity);
        alert("データを登録しました！");
        displayData();  // ←ここ！
    } else {
        alert("数量が入力されていません！");
    }
});

let tempQuantity = 0;

// モーダルを開く
function openModal() {
    tempQuantity = 0;
    document.getElementById("quantityDisplay").textContent = tempQuantity;
    document.getElementById("customModal").style.display = "block";
}

// モーダルを閉じる
function closeModal() {
    document.getElementById("customModal").style.display = "none";
}

// 数量を加算する
function addQuantity(value) {
    let input = document.getElementById("quantityInput");
    let current = parseInt(input.value) || 0;
    input.value = current + value;
}

// 数量を減算する
function subtractQuantity(value) {
    let input = document.getElementById("quantityInput");
    let current = parseInt(input.value) || 0;
    input.value = Math.max(0, current - value);
}

// 数量をクリアする
function clearQuantity() {
    document.getElementById("quantityInput").value = 0;
}

// 登録確定
function confirmQuantity() {
    let quantity = parseInt(document.getElementById("quantityInput").value) || 0;
    if (quantity > 0) {
        // QRコード or 手入力から取得
        let productCode = manualProductCode || "ABC123";  // 仮コードは残しつつ
        let processCode = manualProcessCode || "P001";

        saveData(productCode, processCode, quantity);
        alert("データを登録しました！");
        displayData();
        closeModal();

        // 入力値リセット
        manualProductCode = "";
        manualProcessCode = "";
    } else {
        alert("数量を入力してください！");
    }
}

// モーダルを開くときは数量をリセット
function openModal() {
    document.getElementById("quantityInput").value = 0;
    document.getElementById("customModal").style.display = "block";
}

// 編集モーダルを開く
let editingId = null; // 今編集中のレコードIDを保持する

// 編集モーダルを開く
function openEditModal(id, quantity) {
    editingId = id;
    document.getElementById("editQuantityInput").value = quantity;
    document.getElementById("editModal").style.display = "block";

}

// 編集モーダルを閉じる
function closeEditModal() {
    editingId = null;
    document.getElementById("editModal").style.display = "none";
}

// 編集モーダル：数量を加算する
function editAddQuantity(value) {
    let input = document.getElementById("editQuantityInput");
    let current = parseInt(input.value) || 0;
    input.value = current + value;
}

// 編集モーダル：数量を減算する
function editSubtractQuantity(value) {
    let input = document.getElementById("editQuantityInput");
    let current = parseInt(input.value) || 0;
    input.value = Math.max(0, current - value);
}

// 編集モーダル：保存する
function confirmEdit() {
    let newQuantity = parseInt(document.getElementById("editQuantityInput").value) || 0;
    if (editingId !== null) {
        if (newQuantity === 0) {
            // 数量ゼロは削除確認
            if (confirm("数量が0になっています。このデータを削除しますか？")) {
                let transaction = db.transaction(["scannedData"], "readwrite");
                let store = transaction.objectStore("scannedData");
                store.delete(editingId);

                alert("データを削除しました！");
                closeEditModal();
                displayData();
            } else {
                // キャンセルした場合、編集を続ける
                alert("削除をキャンセルしました。");
            }
        } else {
            // 通常の数量更新
            let transaction = db.transaction(["scannedData"], "readwrite");
            let store = transaction.objectStore("scannedData");
            let request = store.get(editingId);

            request.onsuccess = function(event) {
                let data = event.target.result;
                data.quantity = newQuantity;
                store.put(data);

                alert("データを更新しました！");
                closeEditModal();
                displayData();
            };
        }
    } else {
        alert("数量を正しく入力してください！");
    }
}

    document.addEventListener('DOMContentLoaded', function() {
    // 登録モーダルでのボタンリスナー設定
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            let value = parseInt(this.getAttribute('data-value'));
            if (value >= 0) {
                addQuantity(value);  // +ボタン
            } else {
                subtractQuantity(Math.abs(value));  // -ボタン
            }
        });
    });
    // 編集モーダルの数量ボタンのイベントリスナー
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            let value = parseInt(this.getAttribute('data-value'));
            if (value >= 0) {
                editAddQuantity(value);  // +ボタン
            } else {
                editSubtractQuantity(Math.abs(value));  // -ボタン
            }
         });
    });
    // QRコード読み取りボタン（例）
    document.getElementById('scanBtn').addEventListener('click', function() {
        openModal();  // モーダルを開く処理
    });

    // その他のボタン（例：登録・キャンセル）
    document.getElementById('saveBtn').addEventListener('click', function() {
        confirmQuantity();  // ここで数量の保存処理を呼び出す
    });

    // 編集ボタン（一覧表示から編集）
    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', function() {
            let id = this.getAttribute('data-id');
            openEditModal(id);  // 編集モーダルを開く
        });
    });

    // 削除ボタン（一覧表示から削除）
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            let id = this.getAttribute('data-id');
            openDeleteModal(id);  // 削除確認モーダルを表示
            });
        });
    });

    // 送信ボタン
    document.getElementById('sendButton').addEventListener('click', function () {
        getDataFromIndexedDB()
          .then(dataArray => {
            if (dataArray.length === 0) {
              alert("送信するデータがありません！");
              return;
            }
            sendDataToGAS(dataArray);
          })
          .catch(error => {
            console.error("取得エラー:", error);
          });
      });


let db;
let request = indexedDB.open("inventoryDB", 1);

request.onupgradeneeded = function(event) {
    db = event.target.result;
    db.createObjectStore("scannedData", { keyPath: "id", autoIncrement: true });
};

request.onsuccess = function(event) {
    db = event.target.result;
    displayData()
};

request.onerror = function(event) {
    console.error("IndexedDBオープンエラー", event);
};

// 保存用関数
function saveData(productCode, processCode, quantity) {
    let transaction = db.transaction(["scannedData"], "readwrite");
    let store = transaction.objectStore("scannedData");
    store.add({
        productCode: productCode,
        processCode: processCode,
        quantity: quantity,
        timestamp: new Date().toISOString()
    });
}

let deletingId = null;  // 削除対象のIDを保持

// 削除確認モーダルを開く
function openDeleteModal(id) {
    deletingId = id;  // 削除するレコードのIDを設定
    document.getElementById("deleteModal").style.display = "block";  // モーダル表示
}

// 削除確認（OK）
function confirmDelete() {
    if (deletingId !== null) {
        let transaction = db.transaction(["scannedData"], "readwrite");
        let store = transaction.objectStore("scannedData");
        store.delete(deletingId);  // レコード削除

        alert("データを削除しました！");
        closeDeleteModal();
        displayData();  // 削除後にテーブルを更新
    }
}

// 削除キャンセル（モーダル閉じる）
function closeDeleteModal() {
    deletingId = null;
    document.getElementById("deleteModal").style.display = "none";  // モーダル非表示
}

// IndexedDBからデータを取得する関数
function getDataFromIndexedDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('inventoryDB', 1);

        request.onsuccess = function(event) {
            const db = event.target.result;
            const transaction = db.transaction(['scannedData'], 'readonly');
            const objectStore = transaction.objectStore('scannedData');
            const getRequest = objectStore.getAll(); // 全レコードを取得

            getRequest.onsuccess = function() {
                resolve(getRequest.result); // データ取得成功
            };

            getRequest.onerror = function() {
                reject("データの取得に失敗しました");
            };
        };

        request.onerror = function() {
            reject("IndexedDBのオープンに失敗しました");
        };
    });
}



function sendDataToGAS(dataArray) {
    fetch('https://script.google.com/macros/s/AKfycbyvGHxdX0kAPoXpNDMTzKf-DLd1M5VlNN8W4XAa5Zn1nO5laXE8LOMdOvcr0qqn38An/exec', {
      method: 'POST',
      body: JSON.stringify(dataArray)
    })
    .then(response => response.text())
    .then(result => {
      console.log("送信成功:", result);
      alert("送信完了しました！");
      // 送信成功後にローカルデータ削除などの処理もここに入れられる
    })
    .catch(error => {
      console.error("送信失敗:", error);
      alert("送信に失敗しました");
    });
  }


  let manualProductCode = "";
let manualProcessCode = "";

// 手入力フォームの処理
function startManualEntry() {
    const product = document.getElementById("manualProductCode").value.trim();
    const process = document.getElementById("manualProcessCode").value.trim();

    if (!product || !process) {
        alert("品番と工程番号を両方入力してください。");
        return;
    }

    manualProductCode = product;
    manualProcessCode = process;

    openModal();  // 既存の数量入力モーダルを再利用
}
