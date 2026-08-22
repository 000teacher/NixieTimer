/* =========================================================
   DIGITAL TIMER
   NIXIE TUBE TIMER
   ========================================================= */


/* =========================================================
   DOM取得
   ========================================================= */

const minuteTens =
    document.getElementById("minute-tens");

const minuteOnes =
    document.getElementById("minute-ones");

const secondTens =
    document.getElementById("second-tens");

const secondOnes =
    document.getElementById("second-ones");

const progressBar =
    document.getElementById("progress-bar");

const startButton =
    document.getElementById("start-button");

const pauseButton =
    document.getElementById("pause-button");

const resetButton =
    document.getElementById("reset-button");

const timeButtons =
    document.querySelectorAll(".time-button");

const colonDots =
    document.querySelectorAll(".colon-dot");


/* =========================================================
   タイマー変数
   ========================================================= */

/*
   duration
   設定された時間（ミリ秒）
*/
let duration = 0;


/*
   remaining
   残り時間（ミリ秒）
*/
let remaining = 0;


/*
   startTime
   STARTした瞬間の時刻
*/
let startTime = 0;


/*
   pausedAt
   PAUSEしたときの残り時間
*/
let pausedAt = 0;


/*
   animationFrame
   requestAnimationFrameのID
*/
let animationFrame = null;


/*
   running
   タイマーが動作中か
*/
let running = false;


/*
   最後に音を鳴らした秒
*/
let lastBeepSecond = null;


/* =========================================================
   音
   ========================================================= */

let audioContext = null;


/*
   短いビープ音
*/
function playBeep(duration) {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }


    if (audioContext.state === "suspended") {

        audioContext.resume();

    }


    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.frequency.value = 700;


    gain.gain.setValueAtTime(
        0.4,
        audioContext.currentTime
    );


    oscillator.start();


    oscillator.stop(
        audioContext.currentTime +
        duration
    );

}


/* =========================================================
   終了音
   ========================================================= */

function playFinishBeep() {

    if (!audioContext) {

        audioContext =
            new (
                window.AudioContext ||
                window.webkitAudioContext
            )();

    }


    if (audioContext.state === "suspended") {

        audioContext.resume();

    }


    const oscillator =
        audioContext.createOscillator();

    const gain =
        audioContext.createGain();


    oscillator.connect(gain);

    gain.connect(
        audioContext.destination
    );


    oscillator.frequency.value = 700;


    gain.gain.setValueAtTime(
        0.4,
        audioContext.currentTime
    );


    /*
       1秒間の長い音
    */
    oscillator.start();

    oscillator.stop(
        audioContext.currentTime + 1
    );

}


/* =========================================================
   時間表示
   ========================================================= */

function updateDisplay(time) {

    /*
       マイナスにならないようにする
    */
    time = Math.max(0, time);


    /*
       残り秒数を切り上げる

       例：

       60.0秒 → 60
       59.9秒 → 60
       59.0秒 → 59
    */
    const totalSeconds =
        Math.ceil(time / 1000);


    const minutes =
        Math.floor(
            totalSeconds / 60
        );


    const seconds =
        totalSeconds % 60;


    const minuteTensValue =
        Math.floor(minutes / 10);


    const minuteOnesValue =
        minutes % 10;


    const secondTensValue =
        Math.floor(seconds / 10);


    const secondOnesValue =
        seconds % 10;


    /*
       表示を更新
    */
    minuteTens.textContent =
        minuteTensValue;

    minuteOnes.textContent =
        minuteOnesValue;

    secondTens.textContent =
        secondTensValue;

    secondOnes.textContent =
        secondOnesValue;

}


/* =========================================================
   色の更新
   ========================================================= */

function updateColor(time) {

    if (duration <= 0) {
        return;
    }


    const percentage =
        (time / duration) * 100;


    /*
       いったんすべての状態を解除
    */

    minuteTens.classList.remove(
        "warning-color",
        "danger-color"
    );

    minuteOnes.classList.remove(
        "warning-color",
        "danger-color"
    );

    secondTens.classList.remove(
        "warning-color",
        "danger-color"
    );

    secondOnes.classList.remove(
        "warning-color",
        "danger-color"
    );


    colonDots.forEach(dot => {

        dot.classList.remove(
            "colon-warning",
            "colon-danger"
        );

    });


    progressBar.classList.remove(
        "progress-warning",
        "progress-danger"
    );


    /*
       10%以下
    */

    if (percentage <= 10) {

        minuteTens.classList.add(
            "danger-color"
        );

        minuteOnes.classList.add(
            "danger-color"
        );

        secondTens.classList.add(
            "danger-color"
        );

        secondOnes.classList.add(
            "danger-color"
        );


        colonDots.forEach(dot => {

            dot.classList.add(
                "colon-danger"
            );

        });


        progressBar.classList.add(
            "progress-danger"
        );

    }


    /*
       10%より上、
       50%以下
    */

    else if (percentage <= 50) {

        minuteTens.classList.add(
            "warning-color"
        );

        minuteOnes.classList.add(
            "warning-color"
        );

        secondTens.classList.add(
            "warning-color"
        );

        secondOnes.classList.add(
            "warning-color"
        );


        colonDots.forEach(dot => {

            dot.classList.add(
                "colon-warning"
            );

        });


        progressBar.classList.add(
            "progress-warning"
        );

    }

}


/* =========================================================
   プログレスバー
   ========================================================= */

function updateProgress(time) {

    if (duration <= 0) {

        progressBar.style.width = "0%";

        return;

    }


    /*
       残り時間の割合

       開始時：
       100%

       終了時：
       0%
    */

    const percentage =
        Math.max(
            0,
            Math.min(
                100,
                (time / duration) * 100
            )
        );


    progressBar.style.width =
        percentage + "%";

}


/* =========================================================
   3秒・2秒・1秒の音
   ========================================================= */

function checkCountdownSound(time) {

    /*
       現在の残り秒数
    */
    const seconds =
        Math.ceil(time / 1000);


    /*
       3、2、1秒だけ鳴らす
    */

    if (
        seconds >= 1 &&
        seconds <= 3
    ) {

        /*
           同じ秒で何度も鳴らさない
        */

        if (
            lastBeepSecond !== seconds
        ) {

            playBeep(0.12);

            lastBeepSecond =
                seconds;

        }

    }

}


/* =========================================================
   タイマー更新
   ========================================================= */

function timerLoop(timestamp) {

    /*
       動作していなければ終了
    */

    if (!running) {

        return;

    }


    /*
       STARTしてからの経過時間
    */

    const elapsed =
        performance.now() -
        startTime;


    /*
       残り時間

       ★ここが今回の重要部分

       「残り時間を1秒ずつ減らす」のではなく、

       開始時刻
       ↓
       現在時刻

       から正確に計算する
    */

    remaining =
        Math.max(
            0,
            duration - elapsed
        );


    /*
       表示更新
    */

    updateDisplay(
        remaining
    );


    /*
       プログレスバー
    */

    updateProgress(
        remaining
    );


    /*
       色
    */

    updateColor(
        remaining
    );


    /*
       3・2・1秒の音
    */

    checkCountdownSound(
        remaining
    );


    /*
       終了
    */

    if (remaining <= 0) {

        running = false;

        remaining = 0;


        updateDisplay(0);

        updateProgress(0);

        updateColor(0);


        /*
           0秒の終了音
        */

        playFinishBeep();


        animationFrame = null;

        return;

    }


    /*
       次のフレームへ
    */

    animationFrame =
        requestAnimationFrame(
            timerLoop
        );

}


/* =========================================================
   START
   ========================================================= */

startButton.addEventListener(
    "click",
    function () {

        /*
           時間が設定されていない場合
        */

        if (duration <= 0) {

            return;

        }


        /*
           すでに動作中なら何もしない
        */

        if (running) {

            return;

        }


        /*
           音声を有効化

           STARTボタンをユーザーが
           押したタイミングなので
           ブラウザの音声制限にも対応できる
        */

        if (!audioContext) {

            audioContext =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

        }


        if (
            audioContext.state ===
            "suspended"
        ) {

            audioContext.resume();

        }


        /*
           PAUSEから再開する場合
        */

        if (pausedAt > 0) {

            remaining = pausedAt;

        }


        /*
           ★重要

           STARTを押した瞬間の
           表示を先に確定する。

           これによって、

           00:10
             ↓
           START
             ↓
           00:10

           と表示され、

           一瞬

           00:11

           のようになることを防ぐ。
        */

        updateDisplay(
            remaining
        );


        updateProgress(
            remaining
        );


        updateColor(
            remaining
        );


        /*
           音の判定をリセット
        */

        lastBeepSecond = null;


        /*
           現在時刻を記録

           この直後から経過時間を
           計算する
        */

        startTime =
            performance.now() -
            (duration - remaining);


        /*
           動作開始
        */

        running = true;


        /*
           古いanimationFrameが
           残っていればキャンセル
        */

        if (
            animationFrame !== null
        ) {

            cancelAnimationFrame(
                animationFrame
            );

        }


        /*
           最初のフレームを開始
        */

        animationFrame =
            requestAnimationFrame(
                timerLoop
            );

    }
);


/* =========================================================
   PAUSE
   ========================================================= */

pauseButton.addEventListener(
    "click",
    function () {

        if (!running) {

            return;

        }


        /*
           現在の残り時間を保存
        */

        const elapsed =
            performance.now() -
            startTime;


        remaining =
            Math.max(
                0,
                duration - elapsed
            );


        pausedAt =
            remaining;


        /*
           停止
        */

        running = false;


        if (
            animationFrame !== null
        ) {

            cancelAnimationFrame(
                animationFrame
            );

            animationFrame = null;

        }


        /*
           停止した瞬間の表示を保持
        */

        updateDisplay(
            remaining
        );


        updateProgress(
            remaining
        );


        updateColor(
            remaining
        );

    }
);


/* =========================================================
   RESET
   ========================================================= */

resetButton.addEventListener(
    "click",
    function () {

        /*
           タイマー停止
        */

        running = false;


        /*
           animationFrame停止
        */

        if (
            animationFrame !== null
        ) {

            cancelAnimationFrame(
                animationFrame
            );

            animationFrame = null;

        }


        /*
           設定時間に戻す
        */

        remaining = duration;

        pausedAt = 0;


        /*
           音の状態をリセット
        */

        lastBeepSecond = null;


        /*
           表示更新
        */

        updateDisplay(
            remaining
        );


        updateProgress(
            remaining
        );


        updateColor(
            remaining
        );

    }
);


/* =========================================================
   時間選択ボタン
   ========================================================= */

timeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function () {

                /*
                   分数
                */

                const minutes =
                    Number(
                        this.dataset.minutes
                    );


                /*
                   ミリ秒へ変換
                */

                duration =
                    minutes *
                    60 *
                    1000;


                /*
                   残り時間も同じにする
                */

                remaining =
                    duration;


                pausedAt = 0;


                /*
                   タイマー停止
                */

                running = false;


                if (
                    animationFrame !== null
                ) {

                    cancelAnimationFrame(
                        animationFrame
                    );

                    animationFrame = null;

                }


                /*
                   選択状態
                */

                timeButtons.forEach(
                    btn => {

                        btn.classList.remove(
                            "selected"
                        );

                    }
                );


                this.classList.add(
                    "selected"
                );


                /*
                   音をリセット
                */

                lastBeepSecond = null;


                /*
                   表示
                */

                updateDisplay(
                    remaining
                );


                updateProgress(
                    remaining
                );


                updateColor(
                    remaining
                );

            }
        );

    }
);


/* =========================================================
   初期状態
   ========================================================= */

/*
   最初は

   00:00

   にする。
*/

duration = 0;

remaining = 0;


updateDisplay(0);

updateProgress(0);


/*
   duration = 0なので
   初期色は通常色のまま
*/

updateColor(0);