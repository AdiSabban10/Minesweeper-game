'use strict'

const MINE = '💣'
const FLAG = '🚩'
const EMPTY = ' '

const gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    secsPassed: 0,
    livesCount: 2,
    shownMinesCount: 0
}

var gLevel = {
    SIZE: 4,
    MINES: 2
}

var gBoard
var gTimer

function onInit() {

    resetTime()
    resetGame()

    gBoard = buildBoard()
    renderBoard(gBoard)

    hideGameOver()

    renderLive()
    const elSmiley = document.querySelector('.smiley')
    elSmiley.innerText = '😀'
}

function resetGame() {
    gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.shownMinesCount = 0
    if (gLevel.SIZE === 4) gGame.livesCount = 2 //Level Beginner
    else gGame.livesCount = 3

}

function resetTime() {
    clearInterval(gGame.secsPassed)
    gGame.secsPassed = 0

    var elTimer = document.querySelector('.time')
    elTimer.innerText = gGame.secsPassed
}

function onLevelClicked(elCell) {
    if (elCell.innerHTML === 'Beginner') {
        gLevel.SIZE = 4
        gLevel.MINES = 2
    } else if (elCell.innerHTML === 'Medium') {
        gLevel.SIZE = 8
        gLevel.MINES = 14
    } else if (elCell.innerHTML === 'Expert') {
        gLevel.SIZE = 12
        gLevel.MINES = 32
    }

    onInit()

}

function renderLive() {
    var str = ''
    for (var i = 0; i < gGame.livesCount; i++) {
        str += ' ❤'
    }
    const elLive = document.querySelector('.live')
    elLive.innerText = str
}

function buildBoard() {
    const board = createMat(gLevel.SIZE, gLevel.SIZE)

    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            board[i][j] = {
                minesAroundCount: 0,
                isShown: false,
                isMine: false,
                isMarked: false
            }
        }
    }

    return board
}

function renderBoard(board) {

    var strHTML = '<table><tbody>'
    for (var i = 0; i < board.length; i++) {

        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {

            const className = `cell cell-${i}-${j}`

            strHTML += `<td onclick="onCellClicked(this, ${i}, ${j})" 
            oncontextmenu="onCellMarked(this, ${i}, ${j})" class="${className}"></td>`
        }
        strHTML += '</tr>'
    }
    strHTML += '</tbody></table>'

    const elContainer = document.querySelector('.board-container')
    elContainer.innerHTML = strHTML
}

//The function gets empty random cells and puts mines in them
function putMinesOnBoard(i, j) {
    var k = 0
    while (k < gLevel.MINES) {
        const pos = getEmptyPos()
        if (pos.i === i && pos.j === j) continue
        gBoard[pos.i][pos.j].isMine = true
        k++
    }

}

function getEmptyPos() {
    var emptyPositions = []

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (!currCell.isMine) emptyPositions.push({ i, j })
        }
    }
    const idx = getRandomInt(0, emptyPositions.length)
    return emptyPositions[idx]
}

// The function gets a cell and calculate the number of mines around it
function setMinesNegsCount(rowIdx, colIdx) { 
    var minesCount = 0

    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (i === rowIdx && j === colIdx) continue
            if (gBoard[i][j].isMine) minesCount++
        }
    }
    return minesCount
}

function UpdatBoardMinesNegsCount(board) {
    for (var i = 0; i < board.length; i++) {
        for (var j = 0; j < board[i].length; j++) {
            var mines = setMinesNegsCount(i, j)
            board[i][j].minesAroundCount = mines
        }
    }
}

function renderCell(elCell, i, j) {
    var value
    var currCell = gBoard[i][j]

    if (currCell.isShown) {
        if (currCell.isMine) value = MINE
        else if (currCell.minesAroundCount) value = currCell.minesAroundCount
        else value = EMPTY
    }

    if (currCell.isMarked) {
        if (currCell.isMine && !gGame.isOn) {
            value = MINE
        } else {
            value = FLAG
        }
    }
    elCell.innerHTML = value

}


function onCellClicked(elCell, i, j) {
    
    if (!gGame.isOn) return
    if (gBoard[i][j].isShown) return

    if (gGame.shownCount === 0) { //First click
        putMinesOnBoard(i, j)
        UpdatBoardMinesNegsCount(gBoard)
        startTimer()
    } else {

        if (gBoard[i][j].isMarked) return
        if (gBoard[i][j].isMine) {
            gGame.livesCount--
            renderLive()
            gGame.shownMinesCount++
            if (gGame.livesCount === 0) {
                gameOver(false)
                showAllMins()

                const elSmiley = document.querySelector('.smiley')
                elSmiley.innerText = '🤯'
            }
        } 
    }

    gBoard[i][j].isShown = true
    gGame.shownCount++

    elCell.classList.add('shown')

    renderCell(elCell, i, j)
    
    if (gBoard[i][j].minesAroundCount === 0 && !gBoard[i][j].isMine) expandShown(i, j)
    
    checkGameOver()

}

function onCellMarked(elCell, i, j) {
    // Hiding the right-click context menu
    document.addEventListener('contextmenu', event => {
        event.preventDefault();
    })

    if (gBoard[i][j].isShown) return

    if (gBoard[i][j].isMarked) {
        gBoard[i][j].isMarked = false
        gGame.markedCount--
        
        elCell.innerHTML = EMPTY
    } else {
        gBoard[i][j].isMarked = true
        gGame.markedCount++
        
        elCell.innerHTML = FLAG
    }

    checkGameOver()
}


function expandShown(rowIdx, colIdx) {
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if (i === rowIdx && j === colIdx) continue
            if (gBoard[i][j].isMarked || gBoard[i][j].isMine) continue
            if (gBoard[i][j].isShown) continue

            gBoard[i][j].isShown = true
            gGame.shownCount++
            
            const elNegCell = document.querySelector(`.cell-${i}-${j}`)
            elNegCell.classList.add('shown')
            renderCell(elNegCell, i, j)
            
            if (gBoard[i][j].minesAroundCount === 0) expandShown(i, j)

        }
    }
}



function checkGameOver() {
    var numCellsShuldBeShown = gLevel.SIZE ** 2 - gLevel.MINES + gGame.shownMinesCount
    var numCellsShuldBeMarked = gLevel.MINES - gGame.shownMinesCount

    if (gGame.shownCount === numCellsShuldBeShown &&
        gGame.markedCount === numCellsShuldBeMarked) {
        gameOver(true)

        const elSmiley = document.querySelector('.smiley')
        elSmiley.innerText = '😎'
    }

}

//when clicking a mine, all the mines are revealed
function showAllMins() {
    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            if (!gBoard[i][j].isMine) continue

            gBoard[i][j].isShown = true

            const elCell = document.querySelector(`.cell-${i}-${j}`)

            if (gBoard[i][j].isMarked) {
                elCell.classList.add('marked-mine')
            }
            renderCell(elCell, i, j)
        }
    }
}

function gameOver(isVictory) {
    gGame.isOn = false
    clearInterval(gGame.secsPassed)

    showGameOver()
    const elMsgSpan = document.querySelector('.game-over .msg')
    elMsgSpan.innerText = isVictory ? 'VICTORY' : 'GAME OVER'
    gGame.isOn = false
}

function startTimer() {
    var startTime = Date.now()
    var elTimer = document.querySelector('.time')

    gGame.secsPassed = setInterval(() => {
        const elapsedTime = Date.now() - startTime
        const formattedTime = (elapsedTime / 1000).toFixed(0)
        elTimer.innerText = formattedTime
    }, 37)
}


function showGameOver() {
    const el = document.querySelector('.game-over')
    el.classList.remove('hide')
}

function hideGameOver() {
    const el = document.querySelector('.game-over')
    el.classList.add('hide')
}

