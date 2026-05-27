local RESOURCE_NAME = GetCurrentResourceName()
Config = Config or {}

if Config.Debug == nil then Config.Debug = true end

local Businesses = {}
local Blips = {}
local isUiOpen = false
local currentOpenSlot = nil




local function dprint(...)
    if not Config.Debug then return end
    local args = { ... }
    for i = 1, #args do
        args[i] = tostring(args[i])
    end
    print(("^3[%s]^7 %s"):format(RESOURCE_NAME, table.concat(args, " ")))
end





local function makeVector4(coords)
    if type(coords) == "vector4" or type(coords) == "userdata" then return coords end
    if type(coords) ~= "table" then
        return vector4(0.0, 0.0, 0.0, 0.0)
    end
    return vector4(
        coords.x or coords[1] or 0.0,
        coords.y or coords[2] or 0.0,
        coords.z or coords[3] or 0.0,
        coords.w or coords[4] or 0.0
    )
end

local function clearBlips()
    for id, bl in pairs(Blips) do
        if DoesBlipExist(bl) then
            RemoveBlip(bl)
        end
    end
    Blips = {}
end

local function createBlipForBiz(id, biz)
    if not biz.coords then return end
    local c = makeVector4(biz.coords)
    if Blips[id] and DoesBlipExist(Blips[id]) then
        RemoveBlip(Blips[id])
        Blips[id] = nil
    end

    local sprite = Config.Blips.DefaultSprite
    local color  = Config.Blips.DefaultColor
    local scale  = Config.Blips.DefaultScale

    if biz.blip then
        sprite = biz.blip.sprite or sprite
        color  = biz.blip.color  or color
        scale  = biz.blip.scale  or scale
    end

    local blip = AddBlipForCoord(c.x, c.y, c.z)
    SetBlipSprite(blip, sprite)
    SetBlipColour(blip, color)
    SetBlipScale(blip, scale)
    SetBlipAsShortRange(blip, true)
    BeginTextCommandSetBlipName("STRING")
    AddTextComponentSubstringPlayerName(biz.label or "Business")
    EndTextCommandSetBlipName(blip)

    Blips[id] = blip
end

local function rebuildBlips()
    clearBlips()
    local count = 0
    for id, biz in pairs(Businesses) do
        createBlipForBiz(id, biz)
        count = count + 1
    end
    dprint("rebuildBlips: built", count, "blips")
end





local function openUi(payload)
    if isUiOpen then return end
    isUiOpen = true
    currentOpenSlot = payload and payload.slotId or nil
    SetNuiFocus(true, true)

    dprint("openUi: mode", payload and payload.mode or "nil", "slotId", payload and payload.slotId or "nil")

    SendNUIMessage({
        action  = "openBusinessUi",
        payload = payload
    })
end

local function closeUi()
    if not isUiOpen then return end
    isUiOpen = false
    currentOpenSlot = nil
    SetNuiFocus(false, false)
    dprint("closeUi")
    SendNUIMessage({
        action = "closeBusinessUi"
    })
end





RegisterNetEvent("az-biz:syncAll", function(payload)
    Businesses = payload or {}
    local c = 0
    for _ in pairs(Businesses) do c = c + 1 end
    dprint("syncAll: received", c, "business slots")
    rebuildBlips()
end)

RegisterNetEvent("az-biz:addOrUpdateSlot", function(biz)
    if not biz or not biz.id then return end
    dprint("addOrUpdateSlot: id", biz.id, "label", biz.label or "nil")
    Businesses[biz.id] = biz
    createBlipForBiz(biz.id, biz)

    
    if isUiOpen and currentOpenSlot == biz.id then
        dprint("addOrUpdateSlot: refreshing currently open UI slot", biz.id)
        SendNUIMessage({
            action  = "refreshBusiness",
            payload = {
                slotId = biz.id,
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
        })
    end
end)

RegisterNetEvent("az-biz:openUi", function(payload)
    openUi(payload)
end)

RegisterNetEvent("az-biz:closeUi", function()
    closeUi()
end)


RegisterNetEvent("az-biz:showAd", function(data)
    dprint("showAd NUI forward for biz", data and data.label or "nil")
    SendNUIMessage({
        action  = "showBizAd",
        payload = data
    })
end)

RegisterNetEvent("az-biz:notify", function(data)
    dprint("notify NUI forward", data and data.title or "Business", data and data.message or "")
    SendNUIMessage({
        action = "showBizNotify",
        payload = data or {}
    })
end)





RegisterNUICallback("bizClose", function(_, cb)
    closeUi()
    cb({})
end)

RegisterNUICallback("bizBuyLocation", function(data, cb)
    dprint("NUI bizBuyLocation slot", data and data.slotId or "nil")
    if data and data.slotId then
        TriggerServerEvent("az-biz:buyBusiness", data.slotId)
    end
    cb({})
end)

RegisterNUICallback("bizBuyItem", function(data, cb)
    dprint("NUI bizBuyItem slot", data and data.slotId or "nil", "item", data and data.itemId or "nil")
    if data and data.slotId and data.itemId then
        TriggerServerEvent("az-biz:buyItem", data.slotId, data.itemId)
    end
    cb({})
end)

RegisterNUICallback("bizWithdraw", function(data, cb)
    dprint("NUI bizWithdraw slot", data and data.slotId or "nil", "amount", data and data.amount or "nil")
    if data and data.slotId and data.amount then
        TriggerServerEvent("az-biz:withdrawFunds", data.slotId, tonumber(data.amount) or 0)
    end
    cb({})
end)


RegisterNUICallback("bizDeposit", function(data, cb)
    dprint("NUI bizDeposit slot", data and data.slotId or "nil", "amount", data and data.amount or "nil")
    if data and data.slotId and data.amount then
        TriggerServerEvent("az-biz:depositFunds", data.slotId, tonumber(data.amount) or 0)
    end
    cb({})
end)


RegisterNUICallback("bizUpdateInfo", function(data, cb)
    dprint("NUI bizUpdateInfo slot", data and data.slotId or "nil")
    if data and data.slotId then
        TriggerServerEvent("az-biz:updateInfo", data.slotId, data.label, data.type, data.status)
    end
    cb({})
end)

RegisterNUICallback("bizEsc", function(_, cb)
    closeUi()
    cb({})
end)

RegisterNUICallback("bizCreateNew", function(_, cb)
    dprint("NUI bizCreateNew")
    TriggerServerEvent("az-biz:createFromUi")
    cb({})
end)

RegisterNUICallback("bizAddItem", function(data, cb)
    dprint("NUI bizAddItem slot", data and data.slotId or "nil")
    if data and data.slotId and data.itemId and data.label and data.price then
        TriggerServerEvent("az-biz:addInventoryItem", data.slotId, data.itemId, data.label, tonumber(data.price) or 0)
    end
    cb({})
end)

RegisterNUICallback("bizRemoveItem", function(data, cb)
    dprint("NUI bizRemoveItem slot", data and data.slotId or "nil", "item", data and data.itemId or "nil")
    if data and data.slotId and data.itemId then
        TriggerServerEvent("az-biz:removeInventoryItem", data.slotId, data.itemId)
    end
    cb({})
end)

RegisterNUICallback("bizAddEmployee", function(data, cb)
    dprint("NUI bizAddEmployee slot", data and data.slotId or "nil", "target", data and data.serverId or "nil")
    if data and data.slotId and data.serverId and data.role then
        TriggerServerEvent("az-biz:addEmployee", data.slotId, data.serverId, data.role)
    end
    cb({})
end)

RegisterNUICallback("bizRemoveEmployee", function(data, cb)
    dprint("NUI bizRemoveEmployee slot", data and data.slotId or "nil", "charId", data and data.charId or "nil")
    if data and data.slotId and data.charId then
        TriggerServerEvent("az-biz:removeEmployee", data.slotId, data.charId)
    end
    cb({})
end)

RegisterNUICallback("bizAdvertise", function(data, cb)
    dprint("NUI bizAdvertise slot", data and data.slotId or "nil")
    if data and data.slotId and data.message then
        TriggerServerEvent("az-biz:advertise", data.slotId, tostring(data.message))
    end
    cb({})
end)





CreateThread(function()
    Wait(1500)
    dprint("Requesting initial business sync from server...")
    TriggerServerEvent("az-biz:requestSync")
end)





local function drawHelpText(msg)
    BeginTextCommandDisplayHelp("STRING")
    AddTextComponentSubstringPlayerName(msg)
    EndTextCommandDisplayHelp(0, false, true, -1)
end

local function drawFloatingText(coords, text)
    local onScreen, _x, _y = World3dToScreen2d(coords.x, coords.y, coords.z)
    if onScreen then
        SetTextScale(0.32, 0.32)
        SetTextFont(4)
        SetTextProportional(1)
        SetTextColour(255, 255, 255, 230)
        SetTextCentre(1)
        BeginTextCommandDisplayText("STRING")
        AddTextComponentSubstringPlayerName(text)
        EndTextCommandDisplayText(_x, _y)
    end
end

CreateThread(function()
    while true do
        local sleep = 1000
        local ped = PlayerPedId()
        local pCoords = GetEntityCoords(ped)

        for id, biz in pairs(Businesses) do
            local c = makeVector4(biz.coords)
            local dist = #(pCoords - vector3(c.x, c.y, c.z))
            if dist < (Config.DrawDistance or 30.0) then
                sleep = 0

                DrawMarker(
                    1, c.x, c.y, c.z - 1.0,
                    0.0, 0.0, 0.0,
                    0.0, 0.0, 0.0,
                    1.2, 1.2, 0.3,
                    200, 50, 50, 120,
                    false, false, 2, false, nil, nil, false
                )

                if dist < (Config.InteractDistance or 2.0) then
                    local label = biz.label or "Business"
                    if not biz.ownerCharId and (biz.buyPrice or 0) > 0 then
                        drawHelpText(("Press ~INPUT_CONTEXT~ to purchase ~y~%s~s~ for ~g~$%s~s~"):format(label, tostring(biz.buyPrice or 0)))
                    else
                        drawHelpText(("Press ~INPUT_CONTEXT~ to view ~y~%s~s~"):format(label))
                    end

                    drawFloatingText(vector3(c.x, c.y, c.z + 1.0), label)

                    if IsControlJustPressed(0, 38) and not isUiOpen then
                        dprint("World interact: sending az-biz:interact for slot", id)
                        TriggerServerEvent("az-biz:interact", id)
                    end
                end
            end
        end

        Wait(sleep)
    end
end)
