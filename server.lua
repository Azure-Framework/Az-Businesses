local RESOURCE_NAME = GetCurrentResourceName()
local fw = exports['Az-Framework']
local ui = exports['Az-CharacterUI']

Config = Config or {}
local json = json


if Config.Debug == nil then Config.Debug = true end

local KVP_KEY = Config.KvpKey or "azbiz:all"


local Businesses = {}




local function dprint(...)
    if not Config.Debug then return end
    local args = { ... }
    for i = 1, #args do
        args[i] = tostring(args[i])
    end
    print(("^3[%s]^7 %s"):format(RESOURCE_NAME, table.concat(args, " ")))
end

local function tblCount(t)
    local c = 0
    for _ in pairs(t or {}) do c = c + 1 end
    return c
end





local function saveAllBusinesses()
    local payload = {}

    for id, biz in pairs(Businesses) do
        payload[id] = {
            id          = biz.id,
            label       = biz.label,
            type        = biz.type,
            coords      = { x = biz.coords.x, y = biz.coords.y, z = biz.coords.z, w = biz.coords.w },
            buyPrice    = biz.buyPrice or 0,
            ownerCharId = biz.ownerCharId,
            ownerName   = biz.ownerName,
            balance     = biz.balance or 0,
            open        = biz.open ~= false,
            inventory   = biz.inventory or {},
            employees   = biz.employees or {},
            isDynamic   = biz.isDynamic and true or false,
            blip        = biz.blip or nil
        }
    end

    local jsonStr = json.encode(payload)
    SetResourceKvp(KVP_KEY, jsonStr)
    dprint("saveAllBusinesses: saved", #jsonStr, "bytes to KVP key", KVP_KEY)
end

local function loadAllBusinessesFromKvp()
    local raw = GetResourceKvpString(KVP_KEY)
    if not raw or raw == "" then
        dprint("loadAllBusinessesFromKvp: no KVP data yet")
        return {}
    end

    local ok, decoded = pcall(json.decode, raw)
    if not ok or type(decoded) ~= "table" then
        dprint("loadAllBusinessesFromKvp: failed to decode JSON, ignoring.")
        return {}
    end

    dprint("loadAllBusinessesFromKvp: loaded", #raw, "bytes from KVP")
    return decoded
end





local function makeVector4(tbl)
    if type(tbl) == "vector4" or type(tbl) == "userdata" then
        return tbl
    end
    if type(tbl) ~= "table" then
        return vector4(0.0, 0.0, 0.0, 0.0)
    end
    return vector4(
        tbl.x or tbl[1] or 0.0,
        tbl.y or tbl[2] or 0.0,
        tbl.z or tbl[3] or 0.0,
        tbl.w or tbl[4] or 0.0
    )
end

local function initBusinesses()
    Businesses = {}

    local fromKvp = loadAllBusinessesFromKvp()
    for id, row in pairs(fromKvp) do
        local cfgSlot = (Config.BusinessSlots or {})[id]

        local coords = row.coords or (cfgSlot and cfgSlot.coords)
        local vec = makeVector4(coords)

        Businesses[id] = {
            id          = id,
            label       = row.label or (cfgSlot and cfgSlot.label) or ("Business " .. id),
            type        = row.type or (cfgSlot and cfgSlot.type) or "custom",
            coords      = vec,
            buyPrice    = row.buyPrice or (cfgSlot and cfgSlot.buyPrice) or 0,
            ownerCharId = row.ownerCharId,
            ownerName   = row.ownerName,
            balance     = row.balance or 0,
            open        = row.open ~= false,
            inventory   = row.inventory or {},
            employees   = row.employees or {},
            isDynamic   = row.isDynamic or false,
            blip        = cfgSlot and cfgSlot.blip or nil
        }
    end

    for id, cfgSlot in pairs(Config.BusinessSlots or {}) do
        local existing = Businesses[id]
        local vec = makeVector4(cfgSlot.coords)

        if existing then
            existing.coords   = vec
            existing.label    = cfgSlot.label or existing.label
            existing.type     = cfgSlot.type  or existing.type
            existing.buyPrice = cfgSlot.buyPrice or existing.buyPrice or 0
            existing.blip     = cfgSlot.blip or existing.blip
        else
            Businesses[id] = {
                id          = id,
                label       = cfgSlot.label or ("Business " .. id),
                type        = cfgSlot.type or "custom",
                coords      = vec,
                buyPrice    = cfgSlot.buyPrice or 0,
                ownerCharId = nil,
                ownerName   = nil,
                balance     = 0,
                open        = true,
                inventory   = {},
                employees   = {},
                isDynamic   = false,
                blip        = cfgSlot.blip or nil
            }
        end
    end

    dprint("initBusinesses: built", tblCount(Businesses), "business slots")
end





local function getPlayerCharId(src)
    if not ui or not ui.getActiveCharacter then
        dprint("getPlayerCharId: Az-CharacterUI export missing")
        return nil
    end

    local ok, charId = pcall(function()
        return ui:getActiveCharacter(src)
    end)

    if not ok then
        dprint("getPlayerCharId: error calling getActiveCharacter:", charId)
        return nil
    end

    print(("[Az-CharacterUI] active char for %d = %s"):format(src, tostring(charId or "nil")))

    if not charId or charId == 0 or charId == "" then
        return nil
    end

    return charId
end

local function getDisplayName(src, charId)
    return ("Character %s"):format(charId or src)
end

local function tryDeductMoney(src, amount)
    amount = tonumber(amount) or 0
    if amount <= 0 then
        dprint("tryDeductMoney: amount <= 0, skipping for src", src)
        return true
    end

    if not fw or not fw.deductMoney then
        dprint("tryDeductMoney: fw.deductMoney missing, NOT actually deducting money for src", src, "amount", amount)
        return true
    end

    dprint("tryDeductMoney: attempting to deduct", amount, "from src", src)

    local ok, err = pcall(function()
        fw:deductMoney(src, amount)
    end)

    if not ok then
        dprint("tryDeductMoney: pcall error:", err)
        return true
    end

    return true
end

local function tryAddMoney(src, amount)
    amount = tonumber(amount) or 0
    if amount <= 0 then
        dprint("tryAddMoney: amount <= 0, skipping for src", src)
        return true
    end

    if not fw or not fw.addMoney then
        dprint("tryAddMoney: fw.addMoney missing, NOT actually adding money for src", src, "amount", amount)
        return true
    end

    dprint("tryAddMoney: adding", amount, "to src", src)

    local ok, err = pcall(function()
        fw:addMoney(src, amount)
    end)

    if not ok then
        dprint("tryAddMoney: pcall error:", err)
        return true
    end

    return true
end

local function getRoleForChar(biz, charId)
    if not biz or not charId then return nil end
    for _, emp in ipairs(biz.employees or {}) do
        if tostring(emp.charId) == tostring(charId) then
            return emp.role or "staff"
        end
    end
    return nil
end

local function setOwnerEmployee(biz, charId, name)
    biz.employees = biz.employees or {}
    local found = false

    for _, emp in ipairs(biz.employees) do
        if tostring(emp.charId) == tostring(charId) then
            emp.role = "owner"
            emp.name = name
            found = true
        end
    end

    if not found then
        table.insert(biz.employees, {
            charId = charId,
            name   = name,
            role   = "owner"
        })
    end
end





local function serializeBizForClient(biz)
    return {
        id          = biz.id,
        label       = biz.label,
        type        = biz.type,
        coords      = { x = biz.coords.x, y = biz.coords.y, z = biz.coords.z, w = biz.coords.w },
        buyPrice    = biz.buyPrice or 0,
        ownerCharId = biz.ownerCharId,
        ownerName   = biz.ownerName,
        balance     = biz.balance or 0,
        open        = biz.open ~= false,
        inventory   = biz.inventory or {},
        employees   = biz.employees or {},
        isDynamic   = biz.isDynamic or false,
        blip        = biz.blip or nil
    }
end

local function sendAllBusinessesToPlayer(src)
    local payload = {}
    for id, biz in pairs(Businesses) do
        payload[id] = serializeBizForClient(biz)
    end
    dprint("sendAllBusinessesToPlayer: sending", tblCount(payload), "slots to src", src)
    TriggerClientEvent("az-biz:syncAll", src, payload)
end

local function broadcastBizUpdate(biz)
    dprint("broadcastBizUpdate: slot", biz.id, "label", biz.label)
    TriggerClientEvent("az-biz:addOrUpdateSlot", -1, serializeBizForClient(biz))
end


local function sendUiNotify(src, level, message, title, duration)
    TriggerClientEvent("az-biz:notify", src, {
        level = level or "info",
        message = tostring(message or ""),
        title = tostring(title or "BUSINESS"),
        duration = tonumber(duration) or 3200
    })
end

local function notify(src, level, message, title, duration, chatMessage)
    sendUiNotify(src, level, message, title, duration)
    TriggerClientEvent("chat:addMessage", src, {
        args = { chatMessage or (("^3[%s]^7 %s"):format(title or "Business", message or "")) }
    })
end





local function createPlayerBusiness(src, customLabel)
    dprint("createPlayerBusiness: ENTER src", src, "customLabel", customLabel or "nil")

    local charId = getPlayerCharId(src)
    if not charId then
        dprint("createPlayerBusiness: FAILED getPlayerCharId for src", src)
        notify(src, "error", "You must have an active character to create a business.", "BUSINESS", 3200, "^1[Business]^7 You must have an active character to create a business.")
        return
    end

    local ped = GetPlayerPed(src)
    if not ped or ped == 0 then
        dprint("createPlayerBusiness: FAILED GetPlayerPed for src", src)
        notify(src, "error", "Could not resolve your position.", "BUSINESS", 3200, "^1[Business]^7 Could not resolve your position.")
        return
    end

    local coords  = GetEntityCoords(ped)
    local heading = GetEntityHeading(ped)
    local vec     = vector4(coords.x, coords.y, coords.z, heading)

    local cfg  = Config.BizCreation or {}
    local cost = cfg.Cost or 0

    dprint("createPlayerBusiness: src", src, "charId", charId, "cost", cost)

    if cost > 0 then
        local ok = tryDeductMoney(src, cost)
        dprint("createPlayerBusiness: tryDeductMoney result", ok)
        if not ok then
            notify(src, "error", "Failed to process payment.", "BUSINESS", 3200, "^1[Business]^7 Failed to process payment.")
            return
        end
    else
        dprint("createPlayerBusiness: cost <= 0; no deduction")
    end

    local fullName = getDisplayName(src, charId)
    local label

    if customLabel and customLabel ~= "" then
        label = customLabel
    else
        label = (cfg.LabelTemplate or "%s's Business"):format(fullName or "Business Owner")
    end

    local slotId = ("pbiz_%s_%d"):format(tostring(charId), os.time())

    local biz = {
        id          = slotId,
        label       = label,
        type        = cfg.DefaultType or "custom",
        coords      = vec,
        buyPrice    = 0,
        ownerCharId = charId,
        ownerName   = fullName,
        balance     = 0,
        open        = true,
        inventory   = {},
        employees   = {},
        isDynamic   = true,
        blip        = {
            sprite = Config.Blips.DefaultSprite,
            color  = Config.Blips.DefaultColor,
            scale  = Config.Blips.DefaultScale
        }
    }

    setOwnerEmployee(biz, charId, fullName)

    Businesses[slotId] = biz
    saveAllBusinesses()
    broadcastBizUpdate(biz)

    dprint("createPlayerBusiness: CREATED slot", slotId, "label", label, "for src", src)

    notify(src, "success", ("You created a new business: %s"):format(label), "BUSINESS", 3200, ("^2[Business]^7 You created a new business: ^3%s"):format(label))
end





RegisterNetEvent("az-biz:interact", function(slotId)
    local src = source
    local biz = Businesses[slotId]
    if not biz then
        dprint("az-biz:interact: invalid slot", slotId, "from src", src)
        return
    end

    local charId = getPlayerCharId(src)
    local role = getRoleForChar(biz, charId)

    local mode = "customer"
    if not biz.ownerCharId and biz.buyPrice and biz.buyPrice > 0 then
        mode = "for_sale"
    elseif role == "owner" or role == "manager" then
        mode = "manage"
    end

    local marketingFee = Config.MarketingFee or 250

    dprint("az-biz:interact: src", src, "slot", slotId, "mode", mode, "role", role or "none", "marketingFee", marketingFee)

    local payload = {
        slotId        = slotId,
        slotLabel     = biz.label,
        buyPrice      = biz.buyPrice or 0,
        mode          = mode,
        myRole        = role,
        marketingFee  = marketingFee,
        biz = {
            label       = biz.label,
            type        = biz.type,
            ownerCharId = biz.ownerCharId,
            ownerName   = biz.ownerName,
            balance     = biz.balance or 0,
            open        = biz.open ~= false,
            inventory   = biz.inventory or {},
            employees   = biz.employees or {}
        }
    }

    TriggerClientEvent("az-biz:openUi", src, payload)
end)





RegisterNetEvent("az-biz:buyBusiness", function(slotId)
    local src = source
    local biz = Businesses[slotId]
    if not biz then
        dprint("az-biz:buyBusiness invalid slot", slotId, "from src", src)
        return
    end

    if biz.ownerCharId then
        notify(src, "error", "This business is already owned.", "BUSINESS", 3200, "^1[Business]^7 This business is already owned.")
        return
    end

    local price = tonumber(biz.buyPrice or 0) or 0
    if price <= 0 then
        notify(src, "error", "This business is not for sale.", "BUSINESS", 3200, "^1[Business]^7 This business is not for sale.")
        return
    end

    local charId = getPlayerCharId(src)
    if not charId then
        notify(src, "error", "You must have an active character.", "BUSINESS", 3200, "^1[Business]^7 You must have an active character.")
        return
    end

    dprint("az-biz:buyBusiness: src", src, "slot", slotId, "price", price, "charId", charId)

    local ok = tryDeductMoney(src, price)
    dprint("az-biz:buyBusiness: tryDeductMoney result", ok)
    if not ok then
        notify(src, "error", "Failed to process payment.", "BUSINESS", 3200, "^1[Business]^7 Failed to process payment.")
        return
    end

    local fullName = getDisplayName(src, charId)

    biz.ownerCharId = charId
    biz.ownerName   = fullName
    setOwnerEmployee(biz, charId, fullName)

    saveAllBusinesses()
    broadcastBizUpdate(biz)

    dprint("az-biz:buyBusiness: PURCHASED slot", slotId, "by src", src)

    notify(src, "success", ("You purchased %s for $%s."):format(biz.label, tostring(price)), "PURCHASE", 3200, ("^2[Business]^7 You purchased ^3%s^7 for ^2$%s^7."):format(biz.label, tostring(price)))

    TriggerClientEvent("az-biz:closeUi", src)
end)





RegisterNetEvent("az-biz:buyItem", function(slotId, itemId)
    local src = source
    local biz = Businesses[slotId]
    if not biz then return end

    local inventory = biz.inventory or {}
    local item
    for _, it in ipairs(inventory) do
        if it.id == itemId then
            item = it
            break
        end
    end
    if not item then
        notify(src, "error", "Item not found.", "BUSINESS", 3200, "^1[Business]^7 Item not found.")
        return
    end

    local price = tonumber(item.price or 0) or 0
    if price <= 0 then
        notify(src, "error", "This item is not for sale.", "BUSINESS", 3200, "^1[Business]^7 This item is not for sale.")
        return
    end

    dprint("az-biz:buyItem: src", src, "slot", slotId, "item", itemId, "price", price)

    local ok = tryDeductMoney(src, price)
    dprint("az-biz:buyItem: tryDeductMoney result", ok)

    if not ok then
        notify(src, "error", "Failed to process payment.", "BUSINESS", 3200, "^1[Business]^7 Failed to process payment.")
        return
    end

    biz.balance = (biz.balance or 0) + price
    saveAllBusinesses()
    broadcastBizUpdate(biz)

    notify(src, "success", ("Purchased %s for $%s."):format(item.label or item.id, tostring(price)), "PURCHASE", 3000, ("^2[Business]^7 Purchased ^3%s^7 for ^2$%s^7. (RP item, manual)"):format(item.label or item.id, tostring(price)))
end)

RegisterNetEvent("az-biz:addInventoryItem", function(slotId, itemId, label, price)
    local src = source
    local biz = Businesses[slotId]
    if not biz then return end

    local charId = getPlayerCharId(src)
    local role   = getRoleForChar(biz, charId)
    if role ~= "owner" and role ~= "manager" then
        notify(src, "error", "You are not allowed to manage inventory.", "BUSINESS", 3200, "^1[Business]^7 You are not allowed to manage inventory.")
        return
    end

    itemId = tostring(itemId or ""):gsub("%s+", "")
    label  = tostring(label or ""):gsub("^%s*(.-)%s*$", "%1")
    price  = tonumber(price) or 0

    if itemId == "" or label == "" or price < 0 then
        notify(src, "error", "Invalid item data.", "BUSINESS", 3200, "^1[Business]^7 Invalid item data.")
        return
    end

    biz.inventory = biz.inventory or {}
    local found = false
    for _, it in ipairs(biz.inventory) do
        if tostring(it.id) == itemId then
            it.label = label
            it.price = price
            found = true
            break
        end
    end
    if not found then
        table.insert(biz.inventory, {
            id    = itemId,
            label = label,
            price = price
        })
    end

    saveAllBusinesses()
    broadcastBizUpdate(biz)

    dprint("az-biz:addInventoryItem: src", src, "slot", slotId, "item", itemId, "label", label, "price", price)

    notify(src, "success", ("Stock updated: %s ($%s)."):format(label, tostring(price)), "STOCKROOM", 2800, ("^2[Business]^7 Stock updated: ^3%s^7 ($%s)."):format(label, tostring(price)))
end)

RegisterNetEvent("az-biz:removeInventoryItem", function(slotId, itemId)
    local src = source
    local biz = Businesses[slotId]
    if not biz then return end

    local charId = getPlayerCharId(src)
    local role   = getRoleForChar(biz, charId)
    if role ~= "owner" and role ~= "manager" then
        notify(src, "error", "You are not allowed to manage inventory.", "BUSINESS", 3200, "^1[Business]^7 You are not allowed to manage inventory.")
        return
    end

    itemId = tostring(itemId or "")

    local removed = false
    if biz.inventory then
        for i = #biz.inventory, 1, -1 do
            if tostring(biz.inventory[i].id) == itemId then
                table.remove(biz.inventory, i)
                removed = true
            end
        end
    end

    if removed then
        saveAllBusinesses()
        broadcastBizUpdate(biz)
        dprint("az-biz:removeInventoryItem: src", src, "slot", slotId, "item", itemId)
        notify(src, "success", "Item removed from stock.", "STOCKROOM", 2600, "^2[Business]^7 Item removed from stock.")
    else
        notify(src, "error", "Item not found in stock.", "STOCKROOM", 3200, "^1[Business]^7 Item not found in stock.")
    end
end)

RegisterNetEvent("az-biz:withdrawFunds", function(slotId, amount)
    local src = source
    local biz = Businesses[slotId]
    if not biz then return end

    local charId = getPlayerCharId(src)
    local role = getRoleForChar(biz, charId)
    if role ~= "owner" and role ~= "manager" then
        notify(src, "error", "You are not allowed to withdraw.", "BUSINESS", 3200, "^1[Business]^7 You are not allowed to withdraw.")
        return
    end

    amount = tonumber(amount) or 0
    if amount <= 0 then return end

    if (biz.balance or 0) < amount then
        notify(src, "error", "Not enough business funds.", "FUNDS", 3200, "^1[Business]^7 Not enough business funds.")
        return
    end

    biz.balance = (biz.balance or 0) - amount
    tryAddMoney(src, amount)
    saveAllBusinesses()
    broadcastBizUpdate(biz)

    dprint("az-biz:withdrawFunds: src", src, "slot", slotId, "amount", amount)

    notify(src, "success", ("You withdrew $%s from %s."):format(tostring(amount), biz.label), "FUNDS", 2800, ("^2[Business]^7 You withdrew ^2$%s^7 from ^3%s^7."):format(tostring(amount), biz.label))
end)





RegisterNetEvent("az-biz:depositFunds", function(slotId, amount)
    local src = source
    local biz = Businesses[slotId]
    if not biz then return end

    local charId = getPlayerCharId(src)
    local role = getRoleForChar(biz, charId)
    if role ~= "owner" and role ~= "manager" then
        notify(src, "error", "You are not allowed to deposit into this business.", "FUNDS", 3200, "^1[Business]^7 You are not allowed to deposit into this business.")
        return
    end

    amount = tonumber(amount) or 0
    if amount <= 0 then
        notify(src, "error", "Deposit amount must be greater than 0.", "FUNDS", 3200, "^1[Business]^7 Deposit amount must be greater than 0.")
        return
    end

    dprint("az-biz:depositFunds: src", src, "slot", slotId, "amount", amount)

    local ok = tryDeductMoney(src, amount)
    dprint("az-biz:depositFunds: tryDeductMoney result", ok)

    if not ok then
        notify(src, "error", "Failed to process deposit.", "FUNDS", 3200, "^1[Business]^7 Failed to process deposit.")
        return
    end

    biz.balance = (biz.balance or 0) + amount
    saveAllBusinesses()
    broadcastBizUpdate(biz)

    notify(src, "success", ("You deposited $%s into %s."):format(tostring(amount), biz.label), "FUNDS", 2800, ("^2[Business]^7 You deposited ^2$%s^7 into ^3%s^7."):format(tostring(amount), biz.label))
end)





RegisterNetEvent("az-biz:addEmployee", function(slotId, serverId, role)
    local src = source
    local biz = Businesses[slotId]
    if not biz then return end

    local charId = getPlayerCharId(src)
    local myRole = getRoleForChar(biz, charId)
    if myRole ~= "owner" and myRole ~= "manager" then
        notify(src, "error", "You are not allowed to hire employees.", "STAFF", 3200, "^1[Business]^7 You are not allowed to hire employees.")
        return
    end

    local targetSrc = tonumber(serverId) or 0
    if targetSrc <= 0 or not GetPlayerPed(targetSrc) then
        notify(src, "error", "Invalid or offline player id.", "STAFF", 3200, "^1[Business]^7 Invalid or offline player id.")
        return
    end

    local targetCharId = getPlayerCharId(targetSrc)
    if not targetCharId then
        notify(src, "error", "Target has no active character.", "STAFF", 3200, "^1[Business]^7 Target has no active character.")
        return
    end

    role = (role == "manager") and "manager" or "staff"

    local fullName = getDisplayName(targetSrc, targetCharId)

    biz.employees = biz.employees or {}
    local found = false
    for _, emp in ipairs(biz.employees) do
        if tostring(emp.charId) == tostring(targetCharId) then
            emp.role = role
            emp.name = fullName
            found = true
            break
        end
    end
    if not found then
        table.insert(biz.employees, {
            charId = targetCharId,
            name   = fullName,
            role   = role
        })
    end

    saveAllBusinesses()
    broadcastBizUpdate(biz)

    dprint("az-biz:addEmployee: src", src, "slot", slotId, "target", targetSrc, "role", role)

    notify(src, "success", ("Hired %s as %s."):format(fullName, role:upper()), "STAFF", 2800, ("^2[Business]^7 Hired ^3%s^7 as ^2%s^7."):format(fullName, role:upper()))
end)

RegisterNetEvent("az-biz:removeEmployee", function(slotId, remCharId)
    local src = source
    local biz = Businesses[slotId]
    if not biz then return end

    local myChar = getPlayerCharId(src)
    local myRole = getRoleForChar(biz, myChar)
    if myRole ~= "owner" and myRole ~= "manager" then
        notify(src, "error", "You are not allowed to manage employees.", "STAFF", 3200, "^1[Business]^7 You are not allowed to manage employees.")
        return
    end

    remCharId = tostring(remCharId or "")
    if remCharId == "" then return end

    local removed, removedName = false, nil
    if biz.employees then
        for i = #biz.employees, 1, -1 do
            if tostring(biz.employees[i].charId) == remCharId then
                removedName = biz.employees[i].name
                table.remove(biz.employees, i)
                removed = true
            end
        end
    end

    if removed then
        saveAllBusinesses()
        broadcastBizUpdate(biz)
        dprint("az-biz:removeEmployee: src", src, "slot", slotId, "remCharId", remCharId)
        notify(src, "success", ("Removed employee %s."):format(removedName or remCharId), "STAFF", 2800, ("^2[Business]^7 Removed employee ^3%s^7."):format(removedName or remCharId))
    else
        notify(src, "error", "Employee not found.", "STAFF", 3200, "^1[Business]^7 Employee not found.")
    end
end)





RegisterNetEvent("az-biz:advertise", function(slotId, message)
    local src = source
    local biz = Businesses[slotId]
    if not biz then return end

    local charId = getPlayerCharId(src)
    local role = getRoleForChar(biz, charId)
    if role ~= "owner" and role ~= "manager" then
        notify(src, "error", "You are not allowed to promote this business.", "MARKETING", 3200, "^1[Business]^7 You are not allowed to promote this business.")
        return
    end

    message = tostring(message or ""):gsub("^%s*(.-)%s*$", "%1")
    if message == "" then
        notify(src, "error", "Advertisement message cannot be empty.", "MARKETING", 3200, "^1[Business]^7 Advertisement message cannot be empty.")
        return
    end

    local fee = Config.MarketingFee or 250
    if (biz.balance or 0) < fee then
        notify(src, "error", ("Not enough business funds to advertise (need $%s)."):format(tostring(fee)), "MARKETING", 3200, ("^1[Business]^7 Not enough business funds to advertise (need $%s)."):format(tostring(fee)))
        return
    end

    biz.balance = (biz.balance or 0) - fee
    saveAllBusinesses()
    broadcastBizUpdate(biz)

    dprint("az-biz:advertise: src", src, "slot", slotId, "fee", fee, "msg", message)

    TriggerClientEvent("chat:addMessage", -1, {
        args = {
            ("^8[Business Ad]^7 ^3%s^7: %s"):format(biz.label or "Business", message)
        }
    })

    local status = (biz.open == false) and "CLOSED" or "OPEN"

    
    TriggerClientEvent("az-biz:showAd", -1, {
        label       = biz.label or "Business",
        type        = biz.type or "custom",
        ownerName   = biz.ownerName or ("Character " .. tostring(biz.ownerCharId or "?")),
        ownerCharId = biz.ownerCharId,
        balance     = biz.balance or 0,
        status      = status,
        message     = message,
        fee         = fee
    })

    notify(src, "success", ("Advertisement sent. Cost: $%s from business funds."):format(tostring(fee)), "MARKETING", 3200, ("^2[Business]^7 Advert sent. Cost: ^1$%s^7 from business funds."):format(tostring(fee)))
end)





RegisterNetEvent("az-biz:updateInfo", function(slotId, newLabel, newType, newStatus)
    local src = source
    local biz = Businesses[slotId]
    if not biz then return end

    local charId = getPlayerCharId(src)
    local role = getRoleForChar(biz, charId)
    if role ~= "owner" and role ~= "manager" then
        notify(src, "error", "You are not allowed to edit this business.", "DETAILS", 3200, "^1[Business]^7 You are not allowed to edit this business.")
        return
    end

    newLabel  = tostring(newLabel or ""):gsub("^%s*(.-)%s*$", "%1")
    newType   = tostring(newType or ""):gsub("^%s*(.-)%s*$", "%1")
    newStatus = tostring(newStatus or "open")

    if newLabel ~= "" then
        biz.label = newLabel
    end
    if newType ~= "" then
        biz.type = newType
    end

    biz.open = (newStatus ~= "closed")

    saveAllBusinesses()
    broadcastBizUpdate(biz)

    dprint("az-biz:updateInfo: src", src, "slot", slotId, "label", biz.label, "type", biz.type, "open", tostring(biz.open))

    notify(src, "success", "Business info updated.", "DETAILS", 2600, "^2[Business]^7 Business info updated.")
end)





AddEventHandler("onResourceStart", function(resName)
    if resName ~= RESOURCE_NAME then return end
    dprint("Resource started, initializing businesses from KVP + config...")
    initBusinesses()
end)

AddEventHandler("onResourceStop", function(resName)
    if resName ~= RESOURCE_NAME then return end
    saveAllBusinesses()
    dprint("Resource stopping, all businesses saved.")
end)

RegisterNetEvent("az-biz:requestSync", function()
    local src = source
    sendAllBusinessesToPlayer(src)
end)

RegisterNetEvent("az-biz:createFromUi", function()
    local src = source
    if not src or src == 0 then
        dprint("az-biz:createFromUi called from console; ignoring")
        return
    end
    dprint("az-biz:createFromUi from src", src)
    createPlayerBusiness(src, nil)
end)

CreateThread(function()
    Wait(500)
    local cfg = Config.BizCreation or {}
    local cmdName = cfg.Command or "biz"

    if cfg.Enabled == false then
        dprint("/" .. cmdName .. " explicitly disabled via Config.BizCreation.Enabled = false")
        return
    end

    dprint("Registering /" .. cmdName .. " for player business creation")

    RegisterCommand(cmdName, function(source, args, raw)
        dprint(("/%s run by src %s raw=\"%s\""):format(cmdName, tostring(source), raw or ""))

        if source == 0 then
            print(("[Biz] /%s must be typed in game by a player, not from the server console."):format(cmdName))
            return
        end

        local customLabel = nil
        if args and #args > 0 then
            customLabel = table.concat(args, " ")
        end

        createPlayerBusiness(source, customLabel)
    end, false)
end)
