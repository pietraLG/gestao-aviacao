"""
seat_allocator.py
Módulo Python que implementa lógica de alocação de assentos.
Pode ser facilmente adaptado para usar ctypes/CFFI com biblioteca C compilada.

Este módulo fornece funções de alto nível para gerenciar disponibilidade
e alocação de assentos em voos.
"""

from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import IntEnum


class SeatStatus(IntEnum):
    """Estados possíveis de um assento"""
    AVAILABLE = 0
    OCCUPIED = 1
    RESERVED = 2


class SeatClass(IntEnum):
    """Classificação de assentos"""
    ECONOMY = 0
    BUSINESS = 1
    FIRST = 2


@dataclass
class Seat:
    """Representação de um assento"""
    id: int
    row: int
    column: str
    status: int = SeatStatus.AVAILABLE
    seat_class: int = SeatClass.ECONOMY


class SeatAllocator:
    """
    Gerenciador de alocação de assentos.
    Implementa lógica de disponibilidade, reserva e liberação de assentos.
    """

    def __init__(self):
        self.seats: Dict[int, Seat] = {}

    def initialize_seats(self, aircraft_id: int, total_seats: int, 
                        rows: int, seats_per_row: int, layout: str = "ABCDEF") -> bool:
        """
        Inicializa assentos para uma aeronave.
        
        Args:
            aircraft_id: ID da aeronave
            total_seats: Número total de assentos
            rows: Número de fileiras
            seats_per_row: Assentos por fileira
            layout: String com letras dos assentos (ex: "ABCDEF")
        
        Returns:
            True se inicialização bem-sucedida
        """
        if total_seats <= 0 or rows <= 0 or seats_per_row <= 0:
            return False

        seat_id = 1
        layout_chars = list(layout)

        for row in range(1, rows + 1):
            for col_idx, col in enumerate(layout_chars[:seats_per_row]):
                # Determina classe do assento (business/first nas primeiras fileiras)
                if row <= 3:
                    seat_class = SeatClass.FIRST if col_idx < 2 else SeatClass.BUSINESS
                elif row <= 8:
                    seat_class = SeatClass.BUSINESS
                else:
                    seat_class = SeatClass.ECONOMY

                seat = Seat(
                    id=seat_id,
                    row=row,
                    column=col,
                    status=SeatStatus.AVAILABLE,
                    seat_class=seat_class
                )
                self.seats[seat_id] = seat
                seat_id += 1

        return len(self.seats) == total_seats

    def count_available_seats(self) -> int:
        """Conta assentos disponíveis"""
        return sum(1 for seat in self.seats.values() if seat.status == SeatStatus.AVAILABLE)

    def find_available_seat(self, seat_class: int) -> Optional[int]:
        """
        Encontra um assento disponível de uma classe específica.
        
        Args:
            seat_class: Classe desejada (ECONOMY, BUSINESS, FIRST)
        
        Returns:
            ID do assento ou None
        """
        for seat in self.seats.values():
            if seat.status == SeatStatus.AVAILABLE and seat.seat_class == seat_class:
                return seat.id
        return None

    def reserve_seat(self, seat_id: int) -> bool:
        """
        Reserva um assento específico.
        
        Args:
            seat_id: ID do assento
        
        Returns:
            True se reserva bem-sucedida
        """
        if seat_id not in self.seats:
            return False

        seat = self.seats[seat_id]
        if seat.status == SeatStatus.AVAILABLE:
            seat.status = SeatStatus.RESERVED
            return True

        return False

    def release_seat(self, seat_id: int) -> bool:
        """
        Libera um assento (cancela reserva).
        
        Args:
            seat_id: ID do assento
        
        Returns:
            True se liberação bem-sucedida
        """
        if seat_id not in self.seats:
            return False

        seat = self.seats[seat_id]
        if seat.status == SeatStatus.RESERVED:
            seat.status = SeatStatus.AVAILABLE
            return True

        return False

    def occupy_seat(self, seat_id: int) -> bool:
        """
        Marca um assento como ocupado (após check-in).
        
        Args:
            seat_id: ID do assento
        
        Returns:
            True se ocupação bem-sucedida
        """
        if seat_id not in self.seats:
            return False

        seat = self.seats[seat_id]
        if seat.status == SeatStatus.RESERVED:
            seat.status = SeatStatus.OCCUPIED
            return True

        return False

    def calculate_occupancy_stats(self) -> Tuple[int, int, int]:
        """
        Calcula estatísticas de ocupação.
        
        Returns:
            Tupla (disponíveis, ocupados, reservados)
        """
        available = sum(1 for s in self.seats.values() if s.status == SeatStatus.AVAILABLE)
        occupied = sum(1 for s in self.seats.values() if s.status == SeatStatus.OCCUPIED)
        reserved = sum(1 for s in self.seats.values() if s.status == SeatStatus.RESERVED)

        return available, occupied, reserved

    def validate_configuration(self) -> bool:
        """Valida se a configuração de assentos é válida"""
        if not self.seats:
            return False

        # Verifica se há IDs duplicados
        ids = [seat.id for seat in self.seats.values()]
        return len(ids) == len(set(ids))

    def find_best_seat(self, seat_class: int, seats_per_row: int) -> Optional[int]:
        """
        Encontra o melhor assento disponível (preferência: meio da fileira).
        
        Args:
            seat_class: Classe desejada
            seats_per_row: Assentos por fileira
        
        Returns:
            ID do melhor assento ou None
        """
        best_seat_id = None
        best_score = -1

        for seat in self.seats.values():
            if seat.status == SeatStatus.AVAILABLE and seat.seat_class == seat_class:
                # Calcula score: assentos no meio da fileira têm score mais alto
                position_in_row = ord(seat.column) - ord('A')
                middle_pos = seats_per_row // 2
                score = seats_per_row - abs(position_in_row - middle_pos)

                if score > best_score:
                    best_score = score
                    best_seat_id = seat.id

        return best_seat_id

    def get_seat_map(self) -> List[Dict]:
        """
        Retorna mapa visual de assentos para renderização.
        
        Returns:
            Lista de dicionários com informações de assentos
        """
        seat_list = []
        for seat in sorted(self.seats.values(), key=lambda s: (s.row, s.column)):
            seat_list.append({
                "id": seat.id,
                "row": seat.row,
                "column": seat.column,
                "seatNumber": f"{seat.row}{seat.column}",
                "status": seat.status,
                "seatClass": seat.seat_class,
            })
        return seat_list

    def get_seat_by_id(self, seat_id: int) -> Optional[Dict]:
        """Obtém informações de um assento específico"""
        if seat_id not in self.seats:
            return None

        seat = self.seats[seat_id]
        return {
            "id": seat.id,
            "row": seat.row,
            "column": seat.column,
            "seatNumber": f"{seat.row}{seat.column}",
            "status": seat.status,
            "seatClass": seat.seat_class,
        }


# Instância global para gerenciar alocações
_allocators: Dict[int, SeatAllocator] = {}


def get_allocator(flight_id: int) -> SeatAllocator:
    """Obtém ou cria um alocador para um voo específico"""
    if flight_id not in _allocators:
        _allocators[flight_id] = SeatAllocator()
    return _allocators[flight_id]


def initialize_flight_seats(flight_id: int, aircraft_id: int, total_seats: int,
                           rows: int, seats_per_row: int) -> bool:
    """Inicializa assentos para um voo"""
    allocator = get_allocator(flight_id)
    return allocator.initialize_seats(aircraft_id, total_seats, rows, seats_per_row)


def get_available_seats_count(flight_id: int) -> int:
    """Conta assentos disponíveis em um voo"""
    allocator = get_allocator(flight_id)
    return allocator.count_available_seats()


def reserve_flight_seat(flight_id: int, seat_id: int) -> bool:
    """Reserva um assento em um voo"""
    allocator = get_allocator(flight_id)
    return allocator.reserve_seat(seat_id)


def release_flight_seat(flight_id: int, seat_id: int) -> bool:
    """Libera um assento em um voo"""
    allocator = get_allocator(flight_id)
    return allocator.release_seat(seat_id)


def get_flight_seat_map(flight_id: int) -> List[Dict]:
    """Obtém mapa de assentos de um voo"""
    allocator = get_allocator(flight_id)
    return allocator.get_seat_map()


def get_flight_occupancy_stats(flight_id: int) -> Dict[str, int]:
    """Obtém estatísticas de ocupação de um voo"""
    allocator = get_allocator(flight_id)
    available, occupied, reserved = allocator.calculate_occupancy_stats()
    return {
        "available": available,
        "occupied": occupied,
        "reserved": reserved,
        "total": len(allocator.seats)
    }
