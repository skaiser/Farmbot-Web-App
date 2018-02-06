require_relative "./csheap.rb"
# ORIGINAL IMPLEMENTATION HERE: https://github.com/FarmBot-Labs/Celery-Slicer
# Take a nested ("canonical") representation of a CeleryScript sequence and
# transofrms it to a flat/homogenous intermediate representation which is better
# suited for storage in a relation database.
module CeleryScript
  class Slicer

    def run!(node)
      raise "Not a hash" unless node.is_a?(Hash)
      heap = CSHeap.new()
      allocate(heap, node, CSHeap::NULL)
      @heap_values = heap.values
      binding.pry if heap.entries.keys.length > 5
      heap.dump()
    end

    def is_celery_script(node)
      node && node.is_a?(Hash) && node[:args] && node[:kind]
    end

    def heap_values
      @heap_values
    end

    def allocate(h, s, parentAddr)
      addr = h.allot(s[:kind])
      h.put(addr, CSHeap::PARENT, parentAddr)
      iterate_over_body(h, s, addr)
      iterate_over_args(h, s, addr)
      addr
    end

    def iterate_over_args(h, s, parentAddr)
      (s[:args] || {})
        .keys
        .map do |key|
          v = s[:args][key]
          if (is_celery_script(v))
            k = CSHeap::LINK + key.to_s
            h.put(parentAddr, k, allocate(h, v, parentAddr))
          else
            h.put(parentAddr, key, v)
          end
        end
    end

    def iterate_over_body(heap, canonical_node, parentAddr)
      body = (canonical_node[:body] || []).map(&:deep_symbolize_keys)
      # !body.none? && heap.put(parentAddr, CSHeap::BODY, parentAddr + 1)
      recurse_into_body(heap, body, parentAddr)
    end

    def recurse_into_body(heap, canonical_list, previous_address, index = 0)
      if canonical_list[index]
        my_heap_address   = allocate(heap, canonical_list[index], previous_address)
        parent_key_to_set = (index == 0) ? CSHeap::BODY : CSHeap::NEXT
        binding.pry if (index == 0)
        heap.put(previous_address, parent_key_to_set, my_heap_address)
        recurse_into_body(heap, canonical_list, my_heap_address, index + 1)
      end
    end
  end
end
