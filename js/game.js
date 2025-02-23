'use strict'

const MINE = '💣'
const MARK = '🚩'
const EMPTY = ' '
const HINT = '💡'

const gGame = {}

var gLevel = {
    SIZE: 4,
    MINES: 2
}

var gBoard 


function onInit() {

    resetTime()
    resetGame()

    gBoard = buildBoard()
    renderBoard(gBoard)
    
    hideGameOver()

    renderLives()
    const elSmiley = document.querySelector('.smiley')
    elSmiley.innerText = '😀'

    renderMinesCountUserNeedToMark()
    renderHints()
    renderSafeClick()
    
}

function resetGame() {
    gGame.isOn = true
    gGame.shownCount = 0
    gGame.markedCount = 0
    gGame.shownMinesCount = 0
    
    if (gLevel.SIZE === 4) gGame.livesCount = 1 //Level Beginner
    else gGame.livesCount = 3

    gGame.hintsCount = 3
    gGame.safeCount = 3
    gGame.megaHintLocation = []
    gGame.megaHintIsUsable = true
    gGame.boardOfGamesMoves = [] 
    gGame.dataOfGamesMoves = [] 

}

function resetTime() {
    clearInterval(gGame.secsPassed)
    gGame.secsPassed = 0

    var elTimer = document.querySelector('.time')
    elTimer.innerText = gGame.secsPassed
}

function onLevelClicked(size) {
    if (size === 4) { //Beginner
        gLevel.MINES = 2
    } else if (size === 8) { //Medium
        gLevel.MINES = 14
    } else if (size === 12) { //Expert
        gLevel.MINES = 32
    }
    gLevel.SIZE = size

    onInit()

}

function renderLives() {
    var str = ''
    for (var i = 0; i < gGame.livesCount; i++) {
        str += ' ❤'
    }
    const elLive = document.querySelector('.lives')
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

    var strHTML = ''
    for (var i = 0; i < board.length; i++) {

        strHTML += '<tr>'
        for (var j = 0; j < board[0].length; j++) {

            const className = `cell cell-${i}-${j}`

            strHTML += `<td onclick="onCellClicked(this, ${i}, ${j})" 
            oncontextmenu="onCellMarked(this, ${i}, ${j})" class="${className}"></td>`
        }
        strHTML += '</tr>'
    }

    const elTbody = document.querySelector('.board')
    elTbody.innerHTML = strHTML
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
    var value = ''
    var currCell = gBoard[i][j]

    if (currCell.isShown || gGame.isHintOn || gGame.isMegaHintOn) {
        if (currCell.isMine) value = MINE
        else if (currCell.minesAroundCount) value = currCell.minesAroundCount
        else value = EMPTY
    }

    if (currCell.isMarked) {
        if (currCell.isMine && !gGame.isOn) {
            value = MINE
        } else {
            value = MARK
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
        if (gGame.isHintOn) {
            showCellAndNeg(i, j)
            gGame.isHintOn = false
            return
        } 
        if (gGame.isMegaHintOn) return getLocationsForMegaHint(i, j)
        if (gBoard[i][j].isMarked) return
        if (gBoard[i][j].isMine) {
            gGame.livesCount--
            renderLives()
            gGame.shownMinesCount++
            playSound()
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
    
    renderMinesCountUserNeedToMark()
    checkIsVictory()
    saveCurrMove () 
}

function onCellMarked(elCell, i, j) {
    // Hiding the right-click context menu
    document.addEventListener('contextmenu', event => {
        event.preventDefault();
    })

    if (gGame.shownCount === 0) return //First click
    if (gBoard[i][j].isShown) return

    if (gBoard[i][j].isMarked) {
        gBoard[i][j].isMarked = false
        gGame.markedCount--
        
        elCell.innerHTML = EMPTY
    } else {
        gBoard[i][j].isMarked = true
        gGame.markedCount++
        
        elCell.innerHTML = MARK
    }

    renderMinesCountUserNeedToMark()

    checkIsVictory()
    saveCurrMove () 
}


function expandShown(rowIdx, colIdx) {
    if(gGame.isHintOn || gGame.isMegaHintOn) return // When the hint is activated the opening should not be extended
   
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

// I suggested that winning would be possible if all non-mine squares were exposed,
//  similar to the original game. However, they instructed me to stick to the given
//  instructions, so I deleted this:
// In case of victory, you should put a check mark in the empty cells
// function putMarkInEmptyCell(){
//     for (var i = 0; i < gBoard.length; i++) {
//         for (var j = 0; j < gBoard[i].length; j++) {
//             var currCell = gBoard[i][j]
//             if (currCell.isShown) continue
        
//             const elCell = document.querySelector(`.cell-${i}-${j}`)
//             elCell.innerHTML = MARK
//         }
//     }
//     // Update that all the mines have been found
//     const elMines = document.querySelector('.mines')
//     elMines.innerText = 0
// }

function checkIsVictory() {
    var numCellsShuldBeShown = gLevel.SIZE ** 2 - gLevel.MINES + gGame.shownMinesCount
    var numCellsShuldBeMarked = gLevel.MINES - gGame.shownMinesCount
    
    if (gGame.shownCount === numCellsShuldBeShown &&
        gGame.markedCount === numCellsShuldBeMarked) {
    // if (gGame.shownCount === numCellsShuldBeShown){ I deleted for the reason written above
        // putMarkInEmptyCell() 
        gameOver(true)
        playVictorySound()

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

function renderMinesCountUserNeedToMark(){
    var MinesCountUserNeedToMark = gLevel.MINES - gGame.shownMinesCount - gGame.markedCount

    const elMines = document.querySelector('.mines')
    elMines.innerText = MinesCountUserNeedToMark

}

function showCellAndNeg(rowIdx, colIdx){
    
    for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = colIdx - 1; j <= colIdx + 1; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if(gBoard[i][j].isShown) continue
            if(gBoard[i][j].isMarked) { // Click on hint, the MARK has disappeared
                gBoard[i][j].isMarked = false 
                gGame.markedCount--
                renderMinesCountUserNeedToMark()
            }
            const elCell = document.querySelector(`.cell-${i}-${j}`)
            elCell.classList.add('hint')
            renderCell(elCell, i, j)
            
            setTimeout(() => {
                elCell.classList.remove('hint')
                elCell.innerHTML = EMPTY
            }, 1000)
        }
    }   
}


function renderHints() {
    var strHTML = ``
    for (var i = 0; i < gGame.hintsCount; i++) {
        strHTML += `<button onclick="hintActivation()" class="hint-click">💡</button>`
    }
    const elHints = document.querySelector('.hints')
    elHints.innerHTML = strHTML
}

function hintActivation(){
    if(gGame.isHintOn) return
    if (gGame.shownCount === 0) return
    gGame.isHintOn = true
    gGame.hintsCount--
    renderHints() 
}

function toggleMode(elBtn){
    gGame.isDark = !gGame.isDark
    elBtn.innerText = gGame.isDark ? 'Un Dark' : 'Dark'
    const element = document.body
    const buttons = document.querySelectorAll('.btn')
    buttons.forEach(button => {
        button.classList.toggle('dark')
    })
    element.classList.toggle('dark-mode')

}

function getSafePos() {
    var safePos = []

    for (var i = 0; i < gBoard.length; i++) {
        for (var j = 0; j < gBoard[i].length; j++) {
            var currCell = gBoard[i][j]
            if (!currCell.isMine && !currCell.isShown) safePos.push({ i, j })
        }
    }
    const idx = getRandomInt(0, safePos.length)
    return safePos[idx]
}

function markCellSafeToClick(){
    if (gGame.safeCount === 0) return
    const pos = getSafePos()
    if(!pos) return
    
    gGame.safeCount--

    const elCell = document.querySelector(`.cell-${pos.i}-${pos.j}`)
    elCell.classList.add('hint')
    setTimeout(() => {
        elCell.classList.remove('hint')
    }, 2000)
    
    renderSafeClick()
    
}

function renderSafeClick(){
    const elSpan = document.querySelector('.safe-click')
    elSpan.innerText = gGame.safeCount
}

function playSound() {
    var sound = new Audio("sound/explode.wav")
    sound.play()
}

function playVictorySound() {
    var sound = new Audio("sound/victory.wav")
    sound.play()
}


function onUndoClick(){
    if(!gGame.isOn) return
    if (gGame.boardOfGamesMoves.length === 1) return
    
    updateCurrGameState()
     
    var prevBoard = deepCopyMatrix(gGame.boardOfGamesMoves[gGame.boardOfGamesMoves.length - 2]) 

    for (var i = 0; i < prevBoard.length; i++) {
        for (var j = 0; j < prevBoard[i].length; j++) {
            gBoard[i][j] = prevBoard[i][j]

            const elCell = document.querySelector(`.cell-${i}-${j}`)
            renderCell(elCell, i, j)

            if(!prevBoard[i][j].isShown) elCell.classList.remove('shown')
        }
    }
    renderMinesCountUserNeedToMark()
    renderLives()

    gGame.boardOfGamesMoves.splice(-1, 1)
    gGame.dataOfGamesMoves.splice(-1, 1)
}

function saveCurrMove () {
    var currBoardStatus = deepCopyMatrix(gBoard) 
    gGame.boardOfGamesMoves.push(currBoardStatus)
    
    var currGameStatus = modifyShallowCopy(gGame) 
    gGame.dataOfGamesMoves.push(currGameStatus)
}

function updateCurrGameState(){ 
    var idxPrevMove = gGame.boardOfGamesMoves.length - 2
    var prevGameStatus = gGame.dataOfGamesMoves[idxPrevMove]

    gGame.shownCount = prevGameStatus.shownCount
    gGame.markedCount = prevGameStatus.markedCount
    gGame.shownMinesCount = prevGameStatus.shownMinesCount
    gGame.livesCount = prevGameStatus.livesCount

}

function deepCopyMatrix(matrix) {
    return matrix.map(row => row.map(obj => ({ ...obj })));
}

function modifyShallowCopy(obj) {
    return Object.assign({}, obj)
}

function onMegaHintClick(){
    if (!gGame.megaHintIsUsable) return
    if (gGame.shownCount === 0) return
    gGame.isMegaHintOn = true
    if(gGame.megaHintLocation.length < 2) return
    
    var location1 = gGame.megaHintLocation[0]
    var location2 = gGame.megaHintLocation[1]
    
    showAreaOfBoard(location1, location2)
    gGame.isMegaHintOn = false
    gGame.megaHintIsUsable = false
    
}

function getLocationsForMegaHint(i, j){
    var location = { i , j }
    
    if (gGame.megaHintLocation.length !== 0 && 
        (gGame.megaHintLocation[0].i > i || gGame.megaHintLocation[0].j > j)) return
         
    gGame.megaHintLocation.push(location)
    onMegaHintClick()
}

function showAreaOfBoard(location1, location2){
    var firstRowIdx = location1.i
    var firstColIdx = location1.j
    
    var lastRowIdx = location2.i
    var lastColIdx = location2.j

    for (var i = firstRowIdx; i <= lastRowIdx; i++) {
        if (i < 0 || i >= gBoard.length) continue
        for (var j = firstColIdx; j <= lastColIdx; j++) {
            if (j < 0 || j >= gBoard[i].length) continue
            if(gBoard[i][j].isShown) continue
            if(gBoard[i][j].isMarked) { // Click on hint, the MARK has disappeared
                gBoard[i][j].isMarked = false 
                gGame.markedCount--
                renderMinesCountUserNeedToMark()
            }
            const elCell = document.querySelector(`.cell-${i}-${j}`)
            elCell.classList.add('hint')
            renderCell(elCell, i, j)
            
            setTimeout(() => {
                elCell.classList.remove('hint')
                elCell.innerHTML = EMPTY
            }, 2000)
        }
    }  
}