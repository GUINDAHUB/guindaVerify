-- Añadir campo drag_drop_enabled a la tabla clientes
-- Este script es seguro de ejecutar múltiples veces

DO $$
BEGIN
    -- Verificar si la columna ya existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'drag_drop_enabled'
    ) THEN
        -- Añadir la columna con valor por defecto true
        ALTER TABLE clientes ADD COLUMN drag_drop_enabled BOOLEAN DEFAULT true;
        
        -- Actualizar todos los registros existentes para que tengan drag_drop_enabled = true
        UPDATE clientes SET drag_drop_enabled = true WHERE drag_drop_enabled IS NULL;
        
        RAISE NOTICE 'Columna drag_drop_enabled añadida exitosamente a la tabla clientes';
    ELSE
        RAISE NOTICE 'La columna drag_drop_enabled ya existe en la tabla clientes';
    END IF;
END $$;
